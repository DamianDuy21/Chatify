import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import Language from "../models/Language.js";
import OTP from "../models/OTP.js";
import PendingPassword from "../models/PendingPassword.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { generateOtp } from "../utils/auth.js";
import { sendOtpMail } from "../utils/mailer.js";
import Notification from "../models/Notification.js";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import ConversationSetting from "../models/ConversationSetting.js";

export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find().select(
      "-__v -createdAt -updatedAt"
    );
    res.status(200).json({
      success: true,
      data: {
        languages,
      },
      message: "Lấy danh sách ngôn ngữ thành công",
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Tất cả các trường là bắt buộc" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Mật khẩu hiện tại không chính xác" });
    }

    // Bọc trong transaction để đồng bộ
    const session = await mongoose.startSession();
    session.startTransaction();

    const expireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 phút
    try {
      // 1) Expire tất cả OTP type=change_password liên quan đến email này
      await OTP.updateMany(
        {
          userId: user._id,
          type: "change_password",
          status: "pending",
        },
        { $set: { status: "expired" } },
        { session }
      );
      // 2) Expire tất cả PendingPassword còn pending
      await PendingPassword.updateMany(
        {
          userId: user._id,
          status: "pending",
        },
        { $set: { status: "expired" } },
        { session }
      );

      // 2) Tạo PendingPassword mới
      const pendingPassword = await PendingPassword.create({
        userId: user._id,
        newPassword,
        status: "pending",
        expire_at: expireAt,
      });

      // 2) Tạo OTP mới
      const otp = await OTP.create({
        userId: user._id,
        pendingPasswordId: pendingPassword._id,
        type: "change_password",
        code: generateOtp(),
        status: "pending",
        expire_at: expireAt,
      });

      // 3) Gửi email
      await sendOtpMail({
        to: user.email,
        code: otp.code,
        type: "change_password",
        expiresInMin: 2,
      });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Vui lòng kiểm tra email để lấy mã xác thực",
        data: {
          email: user.email,
          expiresAt: expireAt,
        },
      });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const verifyChangePasswordOtp = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ message: "Tất cả các trường là bắt buộc" });
  }

  try {
    const pendingPassword = await PendingPassword.findOne({
      userId,
      status: "pending",
    });

    if (!pendingPassword) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy yêu cầu thay đổi mật khẩu nào" });
    }

    const validOtp = await OTP.findOne({
      userId,
      pendingPasswordId: pendingPassword._id,
      type: "change_password",
      code,
      status: "pending",
      expire_at: { $gt: new Date() },
    });

    if (!validOtp) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn" });
    }

    // Mark OTP as verified
    validOtp.status = "verified";
    await validOtp.save();

    pendingPassword.status = "verified";
    await pendingPassword.save();

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pendingPassword.newPassword, salt);
    await User.updateOne({ _id: userId }, { password: hash });

    return res
      .status(200)
      .json({ success: true, data: {}, message: "Xác thực mã thành công" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const {
      fullName,
      nativeLanguage: nativeLang,
      learningLanguage: learnLang,
    } = req.query || {};

    const friendRequests = await FriendRequest.find({
      $or: [{ senderId: currentUserId }, { recipientId: currentUserId }],
      status: "pending",
    });

    const friends = await Friend.find({
      $or: [{ firstId: currentUserId }, { secondId: currentUserId }],
    });

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude the current user
        {
          _id: {
            $nin: friends.map((friend) =>
              friend.firstId == currentUserId ? friend.secondId : friend.firstId
            ),
          },
        }, // Exclude friends
        {
          _id: {
            $nin: friendRequests.map((request) =>
              request.senderId == currentUserId
                ? request.recipientId
                : request.senderId
            ),
          },
        }, // Exclude pending friend requests
        fullName ? { fullName: { $regex: fullName, $options: "i" } } : {}, // Filter by full name if provided
        { isOnboarded: true },
      ],
    }).select("-password -createdAt -updatedAt -__v");

    const fullDataRecommendedUsers = (
      await Promise.all(
        recommendedUsers.map(async (user) => {
          const profileFilter = { userId: user._id };
          if (nativeLang) {
            profileFilter.nativeLanguage = { $eq: nativeLang };
          }
          if (learnLang) {
            profileFilter.learningLanguage = { $eq: learnLang };
          }
          const profile = await Profile.findOne(profileFilter).select(
            "-userId -_id -createdAt -updatedAt -__v"
          );
          if (!profile || !user) return null;

          return {
            user: {
              ...user.toObject(),
              profile: {
                ...profile.toObject(),
              },
            },
          };
        })
      )
    ).filter((item) => item != null);

    const users = fullDataRecommendedUsers.filter(Boolean);

    const total = users.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = users.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: {
        users: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      message: "Danh sách người dùng được đề xuất đã được lấy thành công",
    });
  } catch (error) {
    console.error("Error fetching recommended users:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const friends = await Friend.find({
      $or: [{ firstId: currentUserId }, { secondId: currentUserId }],
    });

    const {
      fullName,
      nativeLanguage: nativeLang,
      learningLanguage: learnLang,
    } = req.query || {};

    const fullDataFriends = (
      await Promise.all(
        friends.map(async (friend) => {
          const profileFilter = {
            userId:
              friend.firstId == currentUserId
                ? friend.secondId
                : friend.firstId,
          };
          if (nativeLang) {
            profileFilter.nativeLanguage = { $eq: nativeLang };
          }
          if (learnLang) {
            profileFilter.learningLanguage = { $eq: learnLang };
          }
          const profile = await Profile.findOne(profileFilter).select(
            "-userId -_id -createdAt -updatedAt -__v"
          );
          if (!profile) return null;

          const user = await User.find({
            $and: [
              {
                _id:
                  friend.firstId == currentUserId
                    ? friend.secondId
                    : friend.firstId,
              },
              fullName ? { fullName: { $regex: fullName, $options: "i" } } : {},
            ],
          }).select("-password -createdAt -updatedAt -__v");

          // Lấy private conversation giữa 2 user
          const conversationsMember1 = await ConversationMember.find({
            userId: currentUserId,
          });
          const conversationsMember2 = await ConversationMember.find({
            userId:
              friend.firstId == currentUserId
                ? friend.secondId
                : friend.firstId,
          });

          const conversationId = conversationsMember1
            .map((m1) => {
              const match = conversationsMember2.find(
                (m2) =>
                  m2.conversationId.toString() === m1.conversationId.toString()
              );
              return match ? match.conversationId : null;
            })
            .filter(Boolean); // loại bỏ null

          let conversation;
          if (conversationId.length > 0) {
            conversation = await Conversation.findOne({
              _id: { $in: conversationId },
              type: "private",
            });
          }

          if (!user || user.length === 0) return null;

          return {
            user: {
              ...user[0].toObject(),
              profile: {
                ...profile.toObject(),
              },
            },
            conversation,
          };
        })
      )
    ).filter((item) => item != null);
    const users = fullDataFriends.filter(Boolean);

    const total = users.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = users.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: {
        users: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      message: "Danh sách bạn bè đã được lấy thành công",
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: recipientId } = req.params;

    if (recipientId === currentUserId) {
      return res
        .status(400)
        .json({ message: "Bạn không thể gửi yêu cầu kết bạn cho chính mình" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Check if the recipient is already a friend
    const alreadyFriends = await Friend.find({
      $or: [
        { firstId: currentUserId, secondId: recipientId },
        { firstId: recipientId, secondId: currentUserId },
      ],
    });
    if (alreadyFriends.length > 0) {
      return res.status(400).json({ message: "Người dùng đã là bạn bè" });
    }

    // Check if a friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: currentUserId, recipientId: recipientId },
        { senderId: recipientId, recipientId: currentUserId },
      ],
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Yêu cầu kết bạn đã được gửi" });
    }

    // Create a new friend request
    const newFriendRequest = await FriendRequest.create({
      senderId: currentUserId,
      recipientId: recipientId,
    });

    const profile = await Profile.findOne({ userId: recipient._id }).select(
      "-userId -_id -createdAt -updatedAt -__v"
    );

    const fullDataOutgoingRequest = {
      request: { ...newFriendRequest.toObject() },
      user: {
        ...recipient.toObject(),
        profile: {
          ...profile.toObject(),
        },
      },
    };

    return res.status(201).json({
      success: true,
      data: {
        ...fullDataOutgoingRequest,
      },
      message: "Yêu cầu kết bạn đã được gửi thành công",
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getOutgoingFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const outgoingRequests = await FriendRequest.find({
      senderId: currentUserId,
      status: "pending",
    }).sort({ createdAt: -1 });

    const fullDataOutgoingRequests = (
      await Promise.all(
        outgoingRequests.map(async (request) => {
          const profile = await Profile.findOne({
            userId: request.recipientId,
          }).select("-userId -_id -createdAt -updatedAt -__v");
          const user = await User.findById(request.recipientId).select(
            "-password -createdAt -updatedAt -__v"
          );

          if (!user) return null;

          return {
            request: { ...request.toObject() },
            user: {
              ...user.toObject(),
              profile: {
                ...profile.toObject(),
              },
            },
          };
        })
      )
    ).filter((item) => item != null);

    const total = fullDataOutgoingRequests.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = fullDataOutgoingRequests.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: {
        requests: paginated,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      },
      message: "Danh sách yêu cầu kết bạn đã được lấy thành công",
    });
  } catch (error) {
    console.error("Error fetching outgoing friend requests:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const updateFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: requestId } = req.params;
    const { type } = req.body;
    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      status: "pending",
    });
    if (!friendRequest) {
      return res.status(404).json({ message: "Yêu cầu kết bạn không tồn tại" });
    }

    if (type === "accept") {
      // Cập nhật trạng thái lời mời
      friendRequest.status = "accepted";
      await friendRequest.save();

      // Tạo bản ghi Friend
      await Friend.create({
        firstId:
          friendRequest.senderId == currentUserId
            ? friendRequest.senderId
            : friendRequest.recipientId,
        secondId:
          friendRequest.senderId != currentUserId
            ? friendRequest.senderId
            : friendRequest.recipientId,
      });

      // Tạo thông báo
      await Notification.create({
        userIdRef: currentUserId,
        userId:
          friendRequest.senderId == currentUserId
            ? friendRequest.recipientId
            : friendRequest.senderId,
        content: "friend_request_accepted",
        status: "pending",
      });

      // Xác định 2 user
      const otherUserId =
        friendRequest.senderId == currentUserId
          ? friendRequest.recipientId
          : friendRequest.senderId;

      // Kiểm tra xem đã có private conversation giữa 2 user chưa
      const conversationsMember1 = await ConversationMember.find({
        userId: currentUserId,
      });
      const conversationsMember2 = await ConversationMember.find({
        userId: otherUserId,
      });

      const conversationId = conversationsMember1
        .map((m1) => {
          const match = conversationsMember2.find(
            (m2) =>
              m2.conversationId.toString() === m1.conversationId.toString()
          );
          return match ? match.conversationId : null;
        })
        .filter(Boolean);

      let conversation;

      const c = await Conversation.findOne({
        _id: { $in: conversationId },
        type: "private",
      });
      if (c) {
        conversation = c;
      }
      if (!conversation) {
        conversation = await Conversation.create({
          type: "private",
        });

        await ConversationMember.create({
          userId: currentUserId,
          conversationId: conversation._id,
        });

        await ConversationMember.create({
          userId: otherUserId,
          conversationId: conversation._id,
        });

        const members = [otherUserId];

        const fullDataMembers = (
          await Promise.all(
            members.map(async (memberId) => {
              const profile = await Profile.findOne({
                userId: memberId,
              }).select("-userId -_id -createdAt -updatedAt -__v");
              if (!profile) return null;

              const user = await User.findById(memberId).select(
                "-password -createdAt -updatedAt -__v"
              );
              if (!user) return null;

              return {
                user: {
                  ...user.toObject(),
                  profile: {
                    ...profile.toObject(),
                  },
                },
              };
            })
          )
        ).filter((item) => item != null);

        const mySetting = await ConversationSetting.create({
          conversationId: conversation._id,
          userId: currentUserId,
          getNotifications: false,
          isPinned: false,
          language: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
          translatedTo: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
        });

        await ConversationSetting.create({
          conversationId: conversation._id,
          userId: otherUserId,
          getNotifications: false,
          isPinned: false,
          language: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
          translatedTo: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
        });
        return res.status(200).json({
          success: true,
          data: {
            request: { ...friendRequest.toObject() },
            conversation: {
              conversation: {
                ...conversation.toObject(),
                settings: { ...mySetting.toObject() },
              },
              messages: [],
              users: fullDataMembers,
              unSeenMessageQuantity: 0,
            },
            isNewCreated: true,
          },
          message: "Yêu cầu kết bạn đã được chấp nhận",
        });
      }
      return res.status(200).json({
        success: true,
        data: {
          request: { ...friendRequest.toObject() },
          conversation: null,
          isNewCreated: false,
        },
        message: "Yêu cầu kết bạn đã được chấp nhận",
      });
    }

    if (type == "reject") {
      friendRequest.status = "rejected";
      await friendRequest.save();

      return res.status(200).json({
        success: true,
        message: "Yêu cầu kết bạn đã bị từ chối",
        data: {
          request: { ...friendRequest.toObject() },
        },
      });
    }

    if (type == "cancel") {
      // Cancel the friend request
      friendRequest.status = "cancelled";
      await friendRequest.save();

      return res.status(200).json({
        success: true,
        message: "Yêu cầu kết bạn đã được hủy",
        data: {
          request: { ...friendRequest.toObject() },
        },
      });
    }
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getIncomingFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const incomingFriendRequests = await FriendRequest.find({
      recipientId: currentUserId,
      status: "pending",
    }).sort({ createdAt: -1 });

    const fullDataIncomingFriendRequests = (
      await Promise.all(
        incomingFriendRequests.map(async (request) => {
          const profile = await Profile.findOne({
            userId: request.senderId,
          }).select("-userId -_id -createdAt -updatedAt -__v");

          const user = await User.findById(request.senderId).select(
            "-password -createdAt -updatedAt -__v"
          );

          if (!user) return null;

          return {
            request: request.toObject(),
            user: {
              ...user.toObject(),
              profile: profile ? profile.toObject() : null,
            },
          };
        })
      )
    ).filter((item) => item != null);

    const total = fullDataIncomingFriendRequests.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = fullDataIncomingFriendRequests.slice(
      offset,
      offset + limit
    );

    return res.status(200).json({
      success: true,
      data: {
        requests: paginated,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      },
      message: "Danh sách yêu cầu kết bạn đến đã được lấy thành công",
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: friendId } = req.params;

    if (friendId === currentUserId) {
      return res
        .status(400)
        .json({ message: "Bạn không thể hủy kết bạn với chính mình" });
    }

    // Check if the users are friends
    const friend = await Friend.findOne({
      $or: [
        { firstId: currentUserId, secondId: friendId },
        { firstId: friendId, secondId: currentUserId },
      ],
    });

    if (!friend) {
      return res.status(404).json({ message: "Không tìm thấy bạn bè" });
    }

    // Delete the friend relationship
    await Friend.deleteOne({ _id: friend._id });

    return res.status(200).json({
      success: true,
      message: "Đã hủy kết bạn thành công",
      data: { user: { _id: friendId } },
    });
  } catch (error) {
    console.error("Error deleting friend:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bio, nativeLanguage, learningLanguage, location, profilePic } =
      req.body;

    if (
      !nativeLanguage ||
      !learningLanguage ||
      !location ||
      !bio ||
      !profilePic
    ) {
      return res.status(400).json({
        message: "Tất cả các trường là bắt buộc",
      });
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: "Hồ sơ không tồn tại" });
    }

    profile.bio = bio;
    profile.nativeLanguage = nativeLanguage;
    profile.learningLanguage = learningLanguage;
    profile.location = location;
    profile.profilePic = profilePic;

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ người dùng thành công",
      data: { profile: profile.toObject() },
    });
  } catch (error) {
    console.log("Error in updateProfile controller", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const notifications = await Notification.find({
      userId,
      status: { $ne: "deleted" },
    }).sort({
      createdAt: -1,
    });

    const fullDataNotifications = (
      await Promise.all(
        notifications.map(async (notification) => {
          if (notification.userIdRef) {
            const profile = await Profile.findOne({
              userId: notification.userIdRef,
            }).select("-userId -_id -createdAt -updatedAt -__v");
            const user = await User.findById(notification.userIdRef).select(
              "-password -createdAt -updatedAt -__v"
            );

            if (!user) return;

            return {
              notification: {
                ...notification.toObject(),
              },
              user: {
                ...user.toObject(),
                profile: {
                  ...profile.toObject(),
                },
              },
            };
          } else {
            return {
              notification: {
                ...notification.toObject(),
              },
              user: null,
            };
          }
        })
      )
    ).filter((item) => item != null);

    const total = fullDataNotifications.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = fullDataNotifications.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: {
        notifications: paginated,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      },
      message: "Danh sách thông báo đã được lấy thành công",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: requestId } = req.params;
    const { type } = req.body;
    const notification = await Notification.findOne({
      _id: requestId,
      userId: currentUserId,
      status: {
        $ne: "deleted",
      },
    });
    if (!notification) {
      return res.status(404).json({ message: "Thông báo không tồn tại" });
    }

    if (type == "accept") {
      notification.status = "accepted";
    } else if (type == "delete") {
      notification.status = "deleted";
    }

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông báo thành công",
      data: { notification: notification.toObject() },
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

export const getFriendsCouldBeAddedToGroup = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: conversationId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const conversationMembers = await ConversationMember.find({
      conversationId,
    });
    const memberIds = conversationMembers.map((member) =>
      member.userId.equals(currentUserId) ? null : member.userId
    );

    const friends = await Friend.find({
      $or: [
        { firstId: currentUserId, secondId: { $nin: memberIds } },
        { secondId: currentUserId, firstId: { $nin: memberIds } },
      ],
    });

    const {
      fullName,
      nativeLanguage: nativeLang,
      learningLanguage: learnLang,
    } = req.query || {};

    const fullDataFriends = (
      await Promise.all(
        friends.map(async (friend) => {
          const profileFilter = {
            userId:
              friend.firstId == currentUserId
                ? friend.secondId
                : friend.firstId,
          };
          if (nativeLang) {
            profileFilter.nativeLanguage = { $eq: nativeLang };
          }
          if (learnLang) {
            profileFilter.learningLanguage = { $eq: learnLang };
          }
          const profile = await Profile.findOne(profileFilter).select(
            "-userId -_id -createdAt -updatedAt -__v"
          );
          if (!profile) return null;

          const user = await User.find({
            $and: [
              {
                _id:
                  friend.firstId == currentUserId
                    ? friend.secondId
                    : friend.firstId,
              },
              fullName ? { fullName: { $regex: fullName, $options: "i" } } : {},
            ],
          }).select("-password -createdAt -updatedAt -__v");

          // Lấy private conversation giữa 2 user
          const conversationsMember1 = await ConversationMember.find({
            userId: currentUserId,
          });
          const conversationsMember2 = await ConversationMember.find({
            userId:
              friend.firstId == currentUserId
                ? friend.secondId
                : friend.firstId,
          });

          const conversationId = conversationsMember1
            .map((m1) => {
              const match = conversationsMember2.find(
                (m2) =>
                  m2.conversationId.toString() === m1.conversationId.toString()
              );
              return match ? match.conversationId : null;
            })
            .filter(Boolean); // loại bỏ null

          let conversation;
          if (conversationId.length > 0) {
            conversation = await Conversation.findOne({
              _id: { $in: conversationId },
              type: "private",
            });
          }

          if (!user || user.length === 0) return null;

          return {
            user: {
              ...user[0].toObject(),
              profile: {
                ...profile.toObject(),
              },
            },
            conversation,
          };
        })
      )
    ).filter((item) => item != null);
    const users = fullDataFriends.filter(Boolean);

    const total = users.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = users.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: {
        users: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      message: "Danh sách bạn bè đã được lấy thành công",
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};
