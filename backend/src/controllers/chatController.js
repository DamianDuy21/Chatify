import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import ConversationSetting from "../models/ConversationSetting.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import Message from "../models/Message.js";
import MessageAttachment from "../models/MessageAttachment.js";
import Profile from "../models/Profile.js";
import SeenBy from "../models/SeenBy.js";
import User from "../models/User.js";

export const getTotalConversationQuantityAboveFilter = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const quantity = await ConversationMember.countDocuments({
      userId: currentUserId,
    });

    res.status(200).json({
      success: true,
      data: {
        total: {
          conversations: quantity,
        },
      },
      message: "Lấy tổng số lượng cuộc trò chuyện thành công",
    });
  } catch (error) {
    console.error("Error fetching total conversation quantity:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const getConversationsController = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const { conversationName = null, conversationId = null } = req.query || {};

    let conversations;

    if (conversationId) {
      conversations = await Conversation.find({
        _id: conversationId,
      });
    } else {
      const nameRegex = conversationName
        ? new RegExp(conversationName, "i")
        : null;

      const conversationIds = await ConversationMember.find({
        userId: currentUserId,
      }).distinct("conversationId");

      if (!nameRegex) {
        const allConversations = await Conversation.find({
          _id: { $in: conversationIds },
        });

        const lastMessages = await Message.aggregate([
          {
            $match: {
              conversationId: { $in: allConversations.map((c) => c._id) },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$conversationId",
              lastMessage: { $first: "$$ROOT" },
            },
          },
        ]);

        const conversationIdsWithMsg = new Set(
          lastMessages.map((m) => m._id.toString())
        );
        const noMsgConversations = allConversations.filter(
          (c) => !conversationIdsWithMsg.has(c._id.toString())
        );

        const conversationsWithMsg = lastMessages.map((m) => ({
          _id: m._id,
          sortAt: m.lastMessage.createdAt,
        }));
        const conversationsNoMsg = noMsgConversations.map((c) => ({
          _id: c._id,
          sortAt: c.updatedAt,
        }));

        const merged = [...conversationsWithMsg, ...conversationsNoMsg].sort(
          (a, b) => b.sortAt - a.sortAt
        );

        const limitedIds = merged.map((x) => x._id);

        const unsortedConversations = await Conversation.find({
          _id: { $in: limitedIds },
        });
        conversations = limitedIds.map((id) =>
          unsortedConversations.find((c) => c._id.equals(id))
        );
      } else {
        const nonPrivateConversations = await Conversation.find({
          _id: { $in: conversationIds },
          type: { $ne: "private" },
          name: { $regex: nameRegex },
        });

        const privateConversationIds = await Conversation.distinct("_id", {
          _id: { $in: conversationIds },
          type: "private",
        });

        let privateConversations = [];
        if (privateConversationIds.length) {
          const matchedUserIds = await User.distinct("_id", {
            fullName: { $regex: nameRegex },
          });

          let matchedPrivateConversationIds = [];
          if (matchedUserIds.length) {
            matchedPrivateConversationIds = await ConversationMember.distinct(
              "conversationId",
              {
                conversationId: { $in: privateConversationIds },
                userId: { $in: matchedUserIds, $ne: currentUserId },
              }
            );
          }

          privateConversations = matchedPrivateConversationIds.length
            ? await Conversation.find({
                _id: { $in: matchedPrivateConversationIds },
              })
            : [];
        }

        const merged = [
          ...nonPrivateConversations,
          ...privateConversations,
        ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        conversations = merged;
      }
    }

    const fullDataConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const notMyRecentMessage = await Message.find({
          conversationId: { $in: conversation._id },
          senderId: { $ne: currentUserId },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("-__v -createdAt -updatedAt");

        const unSeenMessages = notMyRecentMessage.map(async (msg) => {
          const isSeen = await SeenBy.findOne({
            messageId: msg._id,
            userId: currentUserId,
          });
          return isSeen ? 0 : 1;
        });
        const unSeenMessageQuantity = (
          await Promise.all(unSeenMessages)
        ).reduce((acc, curr) => acc + curr, 0);

        const memberIds = await ConversationMember.find({
          conversationId: conversation._id,
          userId:
            conversation.type == "group"
              ? { $ne: null }
              : { $ne: currentUserId },
        }).select("userId");

        let keyMemberId;
        if (conversation.type === "group") {
          keyMemberId = await ConversationMember.find({
            conversationId: conversation._id,
            isKeyMember: true,
          }).select("userId");
        }

        const users = await Promise.all(
          memberIds.map(async (member) => {
            const profile = await Profile.findOne({
              userId: member.userId,
            }).select("-userId -_id -createdAt -updatedAt -__v");
            if (!profile) return null;

            const user = await User.findById(member.userId).select(
              "-password -createdAt -updatedAt -__v"
            );
            if (!user) return null;

            let isFriend;
            let isSendFriendRequest;

            if (conversation.type === "group") {
              isFriend = await Friend.findOne({
                $or: [
                  { firstId: currentUserId, secondId: member.userId },
                  { firstId: member.userId, secondId: currentUserId },
                ],
              });
              isSendFriendRequest = await FriendRequest.findOne({
                $or: [
                  { senderId: currentUserId, recipientId: member.userId },
                  { senderId: member.userId, recipientId: currentUserId },
                ],
                status: "pending",
              });

              if (keyMemberId) {
                return {
                  user: {
                    ...user.toObject(),
                    profile: {
                      ...profile.toObject(),
                    },
                  },
                  isKeyMember: keyMemberId.some(
                    (km) => km.userId.toString() == member.userId.toString()
                  ),
                  isFriend: Boolean(isFriend),
                  isSendFriendRequest: Boolean(isSendFriendRequest),
                };
              }
            }

            return {
              user: {
                ...user.toObject(),
                profile: {
                  ...profile.toObject(),
                },
              },
            };
          })
        );

        const recentMessages = await Message.find({
          conversationId: { $in: conversation._id },
        })
          .sort({ createdAt: -1 })
          .limit(16)
          .select("-__v ");

        const sortedMessages = [...recentMessages].reverse();

        // const viewerId = new mongoose.Types.ObjectId(req.user._id);

        const fullDataMessages = await Promise.all(
          sortedMessages.map(async (message) => {
            const sender = await User.findById(message.senderId).select(
              "-password -createdAt -updatedAt -__v"
            );
            const profileSender = await Profile.findOne({
              userId: message.senderId,
            }).select("-userId -_id -createdAt -updatedAt -__v");

            const attachments = await MessageAttachment.find({
              messageId: message._id,
            });
            const imageAttachments = attachments.filter(
              (attachment) => attachment.type === "image"
            );
            const videoAttachments = attachments.filter(
              (attachment) => attachment.type === "video"
            );
            const fileAttachments = attachments.filter(
              (attachment) => attachment.type === "file"
            );
            const seenBy = await SeenBy.find({ messageId: message._id });
            const fullDataSeenBy = await Promise.all(
              seenBy.map(async (seen) => {
                const user = await User.findById(seen.userId).select(
                  "-password -createdAt -updatedAt -__v"
                );
                if (!user) return null;
                const profile = await Profile.findOne({
                  userId: seen.userId,
                }).select("-userId -_id -createdAt -updatedAt -__v");
                return {
                  user: {
                    ...user.toObject(),
                    profile: {
                      ...profile.toObject(),
                    },
                  },
                };
              })
            );
            if (!sender) {
              return {
                sender: null,
                message: {
                  ...message.toObject(),
                  attachments: {
                    images: imageAttachments,
                    videos: videoAttachments,
                    files: fileAttachments,
                  },
                },
                seenBy: fullDataSeenBy,
              };
            }
            return {
              sender: {
                ...sender.toObject(),
                profile: {
                  ...profileSender.toObject(),
                },
              },
              message: {
                ...message.toObject(),
                attachments: {
                  images: imageAttachments,
                  videos: videoAttachments,
                  files: fileAttachments,
                },
              },
              seenBy: fullDataSeenBy,
            };
          })
        );

        const lastMessage = sortedMessages[sortedMessages.length - 1];

        const settings = await ConversationSetting.findOne({
          conversationId: conversation._id,
          userId: currentUserId,
        });

        return {
          conversation: {
            ...conversation.toObject(),
            lastMessage: lastMessage || null,
            settings,
            updatedAt: lastMessage
              ? lastMessage.createdAt
              : conversation.updatedAt,
          },
          messages: fullDataMessages,
          users,
          unSeenMessageQuantity,
        };
      })
    );

    const resConversations = fullDataConversations.filter(Boolean);

    const total = resConversations.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = resConversations.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        conversations: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      message: "Lấy danh sách cuộc trò chuyện thành công",
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const createGroupController = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { name, memberIds } = req.body;

    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Invalid group data" });
    }

    const newGroup = await Conversation.create({
      name,
      type: "group",
    });

    let mySetting;
    let fullDataMembers = await Promise.all(
      memberIds.map(async (memberId) => {
        const user = await User.findById(memberId).select(
          "-password -createdAt -updatedAt -__v"
        );
        if (!user) return null;
        const profile = await Profile.findOne({ userId: memberId }).select(
          "-userId -_id -createdAt -updatedAt -__v"
        );
        if (!profile) return null;

        return {
          user: {
            ...user.toObject(),
            profile: {
              ...profile.toObject(),
            },
          },
          isKeyMember: memberId.toString() == currentUserId.toString(),
          isFriend: true,
          isSendFriendRequest: false,
        };
      })
    );
    fullDataMembers = fullDataMembers.filter(Boolean);

    await Promise.all(
      memberIds.map(async (memberId) => {
        await ConversationMember.create({
          userId: memberId,
          conversationId: newGroup._id,
          isKeyMember: memberId.toString() == currentUserId.toString(),
        });
        if (memberId.toString() == currentUserId.toString()) {
          mySetting = await ConversationSetting.create({
            conversationId: newGroup._id,
            userId: memberId,
            getNotifications: false,
            isPinned: false,
            language: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
            translatedTo: new mongoose.Types.ObjectId(
              "68b26fe629f59a1a322ae67c"
            ),
          });
        } else {
          await ConversationSetting.create({
            conversationId: newGroup._id,
            userId: memberId,
            getNotifications: true,
            isPinned: false,
            language: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
            translatedTo: new mongoose.Types.ObjectId(
              "68b26fe629f59a1a322ae67c"
            ),
          });
        }
      })
    );

    res.status(201).json({
      success: true,
      data: {
        conversation: {
          ...newGroup.toObject(),
          lastMessage: null,
          settings: mySetting,
        },
        users: fullDataMembers,
        unSeenMessageQuantity: 0,
      },
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const addMembersToGroupController = async (req, res) => {
  const conversationId = req.params.id;
  const { memberIds } = req.body;
  try {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Invalid member data" });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Group not found" });
    }
    const existingMemberIds = await ConversationMember.find({
      conversationId,
    }).distinct("userId");

    const newMemberIds = memberIds.filter(
      (id) => !existingMemberIds.includes(id)
    );
    if (newMemberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "All members are already in the group" });
    }
    let fullDataNewMembers = await Promise.all(
      newMemberIds.map(async (memberId) => {
        const user = await User.findById(memberId).select(
          "-password -createdAt -updatedAt -__v"
        );
        if (!user) return null;
        const profile = await Profile.findOne({ userId: memberId }).select(
          "-userId -_id -createdAt -updatedAt -__v"
        );
        if (!profile) return null;
        return {
          user: {
            ...user.toObject(),
            profile: {
              ...profile.toObject(),
            },
          },
          isKeyMember: false,
          isFriend: true,
          isSendFriendRequest: false,
        };
      })
    );
    fullDataNewMembers = fullDataNewMembers.filter(Boolean);
    await Promise.all(
      newMemberIds.map(async (memberId) => {
        await ConversationMember.create({
          userId: memberId,
          conversationId: conversation._id,
          isKeyMember: false,
        });
        await ConversationSetting.create({
          conversationId: conversation._id,
          userId: memberId,
          getNotifications: true,
          isPinned: false,
          language: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
          translatedTo: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
        });
      })
    );
    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          ...conversation.toObject(),
          lastMessage: null,
          settings: null,
        },
        users: fullDataNewMembers,
        unSeenMessageQuantity: 0,
      },
      message: "Thêm thành viên vào nhóm thành công",
    });
  } catch (error) {
    console.error("Error adding members to group:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteMemberFromGroupController = async (req, res) => {
  const conversationId = req.params.id;
  const { memberId } = req.body;
  try {
    if (!memberId) {
      return res.status(400).json({ message: "Invalid member data" });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Group not found" });
    }
    const member = await ConversationMember.findOne({
      conversationId,
      userId: memberId,
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found in group" });
    }
    await ConversationMember.deleteOne({ _id: member._id });
    await ConversationSetting.deleteOne({
      conversationId,
      userId: memberId,
    });
    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          ...conversation.toObject(),
          lastMessage: null,
          settings: null,
        },
        user: {
          _id: memberId,
        },
      },
      message: "Xóa thành viên khỏi nhóm thành công",
    });
  } catch (error) {
    console.error("Error deleting member from group:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const leaveGroupController = async (req, res) => {
  const conversationId = req.params.id;
  const currentUserId = req.user?._id;

  const { isKeyMember = false, newKeyMemberId = null } = req.body || {};

  if (!currentUserId) {
    return res.status(400).json({ message: "Invalid member data" });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const conversation = await Conversation.findById(conversationId).session(
        session
      );
      if (!conversation || conversation.type !== "group") {
        throw { status: 404, message: "Group not found" };
      }

      const leavingMember = await ConversationMember.findOne({
        conversationId,
        userId: currentUserId,
      }).session(session);

      if (!leavingMember) {
        throw { status: 404, message: "Member not found in group" };
      }

      if (isKeyMember === true) {
        if (!newKeyMemberId) {
          throw {
            status: 400,
            message: "Vui lòng chọn trưởng nhóm mới (newKeyMemberId).",
          };
        }
        if (String(newKeyMemberId) === String(currentUserId)) {
          throw {
            status: 400,
            message: "Không thể chuyển vai trò cho chính bạn.",
          };
        }

        const receiver = await ConversationMember.findOne({
          conversationId,
          userId: newKeyMemberId,
        }).session(session);

        if (!receiver) {
          throw {
            status: 404,
            message: "Thành viên nhận quyền không tồn tại trong nhóm.",
          };
        }

        receiver.isKeyMember = true;
        await receiver.save({ session });
      }

      await ConversationMember.deleteOne({ _id: leavingMember._id }).session(
        session
      );

      await ConversationSetting.deleteOne({
        conversationId,
        userId: currentUserId,
      }).session(session);

      const usersPayload =
        isKeyMember && newKeyMemberId
          ? [{ _id: newKeyMemberId, isKeyMember: true }]
          : [];

      res.status(200).json({
        success: true,
        data: {
          conversation: {
            ...conversation.toObject(),
            lastMessage: null,
            settings: null,
          },
          users: usersPayload,
        },
        message: "Rời khỏi nhóm thành công",
      });
    });
  } catch (err) {
    console.error("leaveGroupController error:", err);
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }
    const status = err?.status || 500;
    const message = err?.message || "Lỗi máy chủ nội bộ";
    return res.status(status).json({ message });
  } finally {
    session.endSession();
  }
};

export const markAllMessagesAsSeenController = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(400).json({ message: "Invalid user data" });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const messageIds = await Message.distinct("_id", {
      conversationId,
      senderId: { $ne: currentUserId },
    });

    if (!messageIds.length) {
      return res
        .status(200)
        .json({ message: "No messages to mark", inserted: 0 });
    }

    const ops = messageIds.map((mid) => ({
      updateOne: {
        filter: { messageId: mid, userId: currentUserId },
        update: { $setOnInsert: { messageId: mid, userId: currentUserId } },
        upsert: true,
      },
    }));

    const BATCH_SIZE = 1000;
    let insertedCount = 0;
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
      const slice = ops.slice(i, i + BATCH_SIZE);
      const result = await SeenBy.bulkWrite(slice, { ordered: false });
      insertedCount += result?.upsertedCount || 0;
    }
    return res.status(200).json({
      message: "All messages marked as seen",
      data: {
        total: {
          messages: messageIds.length,
          inserted: insertedCount,
        },
      },
    });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const deleteConversationController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const conversationId = req.params.id;
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid user data" });
    }

    const conversation = await Conversation.findById(conversationId).session(
      session
    );
    if (!conversation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Conversation not found" });
    }

    const deleteWholeConversation = async () => {
      const messageIds = await Message.distinct("_id", {
        conversationId,
      }).session(session);

      const delMembers = await ConversationMember.deleteMany({
        conversationId,
      }).session(session);
      const delSettings = await ConversationSetting.deleteMany({
        conversationId,
      }).session(session);

      if (messageIds.length) {
        await SeenBy.deleteMany({ messageId: { $in: messageIds } }).session(
          session
        );
        await MessageAttachment.deleteMany({
          messageId: { $in: messageIds },
        }).session(session);
      }
      await Message.deleteMany({ conversationId }).session(session);
      await Conversation.deleteOne({ _id: conversationId }).session(session);

      return {
        data: {
          conversation: {
            _id: conversationId,
          },
          total: {
            members: delMembers?.deletedCount || 0,
            settings: delSettings?.deletedCount || 0,
            messages: messageIds.length,
          },
        },
      };
    };

    // ===== Case 1: GROUP/CHATBOT
    if (conversation.type !== "private") {
      const stats = await deleteWholeConversation();
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
        ...stats,
      });
    }

    // ===== Case 2: PRIVATE =====
    const memberIds = await ConversationMember.find({ conversationId })
      .distinct("userId")
      .session(session);

    const otherMemberId = memberIds.find(
      (id) => id.toString() !== currentUserId.toString()
    );

    if (!otherMemberId) {
      const stats = await deleteWholeConversation();
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message:
          "Conversation deleted successfully (private - single member fallback)",
        ...stats,
      });
    }

    const isFriend = await Friend.findOne({
      $or: [
        { firstId: currentUserId, secondId: otherMemberId },
        { firstId: otherMemberId, secondId: currentUserId },
      ],
    }).session(session);

    if (isFriend) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Không thể xóa cuộc trò chuyện (người dùng là bạn bè)",
      });
    }

    const stats = await deleteWholeConversation();

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      message: " Xóa cuộc trò chuyện thành công",
      ...stats,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
