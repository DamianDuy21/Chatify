import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import { generateStreamToken } from "../lib/stream.js";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import ConversationSetting from "../models/ConversationSetting.js";
import Friend from "../models/Friend.js";
import Message from "../models/Message.js";
import MessageAttachment from "../models/MessageAttachment.js";
import Profile from "../models/Profile.js";
import SeenBy from "../models/SeenBy.js";
import User from "../models/User.js";

export const getConversationMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    // const currentUserId = req.user?._id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // const conversationSettings = await ConversationSetting.findOne({
    //   conversationId,
    // });

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const sortedMessages = [...messages].reverse();

    // const viewerId = new mongoose.Types.ObjectId(req.user._id);

    // const toMark = messages.filter(
    //   (m) => String(m.senderId) !== String(currentUserId)
    // );

    // if (toMark.length > 0) {
    //   const ops = toMark.map((m) => ({
    //     updateOne: {
    //       filter: { messageId: m._id, userId: currentUserId },
    //       update: { $setOnInsert: { messageId: m._id, userId: currentUserId } },
    //       upsert: true,
    //     },
    //   }));

    //   await SeenBy.bulkWrite(ops, { ordered: false });
    // }

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
            const profile = await Profile.findOne({
              userId: seen.userId,
            }).select("-userId -_id -createdAt -updatedAt -__v");
            return {
              // ...seen.toObject(),
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

    return res.status(200).json({
      message: "Messages fetched successfully",
      data: {
        conversation: {
          messages: fullDataMessages,
          // settings: conversationSettings,
        },
        pagination: {
          page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationMembers = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const memberIds = await ConversationMember.find({ conversationId });
    const fullDataMembers = await Promise.all(
      memberIds.map(async (member) => {
        const user = await User.findById(member.userId).select(
          "-password -createdAt -updatedAt -__v"
        );
        const profile = await Profile.findOne({ userId: member.userId }).select(
          "-userId -_id -createdAt -updatedAt -__v"
        );

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

    return res.status(200).json({
      message: "Conversation members fetched successfully",
      data: {
        members: fullDataMembers,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation members:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationMedia = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const media = await Message.find({
      conversationId,
      image: { $exists: true },
      video: { $exists: true },
    })
      .select("image, video")
      .lean()
      .sort({ createdAt: -1 });

    const total = media.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = media.slice(offset, offset + limit);

    return res.status(200).json({
      message: "Conversation media fetched successfully",
      data: {
        media: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching conversation media:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversationFiles = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const files = await Message.find({
      conversationId,
      file: { $exists: true },
    })
      .select("file")
      .lean()
      .sort({ createdAt: -1 });

    const total = files.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = files.slice(offset, offset + limit);

    return res.status(200).json({
      message: "Conversation files fetched successfully",
      data: {
        files: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching conversation files:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 30 },
  }).fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
    { name: "files", maxCount: 10 },
  ]);

  const uploadBufferToCloudinary = (buffer, filename, mimetype, folder) =>
    new Promise((resolve, reject) => {
      const isImage = mimetype?.startsWith("image/");
      const isVideo = mimetype?.startsWith("video/");
      const resourceType = isImage ? "image" : isVideo ? "video" : "raw";

      const options = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      };

      if (resourceType === "video") {
        options.eager = [
          { format: "mp4", transformation: { quality: "auto" } },
        ];
        options.eager_async = false;
        options.chunk_size = 6 * 1024 * 1024;
      }

      const stream = cloudinary.uploader.upload_stream(
        options,
        (err, result) => {
          if (err || !result) return reject(err || new Error("Upload failed"));

          let displayUrl = result.secure_url;
          if (resourceType === "video" && result.eager?.[0]?.secure_url) {
            displayUrl = result.eager[0].secure_url;
          }

          resolve({
            secure_url: displayUrl,
            original_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
          });
        }
      );

      stream.end(buffer);
    });

  upload(req, res, async (multerErr) => {
    if (multerErr) {
      console.error("multer error:", multerErr);
      return res.status(400).json({ message: "Invalid upload." });
    }
    try {
      const senderId = req.user.id;

      const { id: conversationId } = req.params;

      const { text = "" } = req.body;

      const imageFiles = req.files?.images ?? [];
      const videoFiles = req.files?.videos ?? [];
      const otherFiles = req.files?.files ?? [];

      if (
        !text.trim() &&
        imageFiles.length === 0 &&
        videoFiles.length === 0 &&
        otherFiles.length === 0
      ) {
        return res.status(400).json({ message: "Empty message" });
      }

      const [uploadedImages, uploadedVideos, uploadedOthers] =
        await Promise.all([
          Promise.all(
            imageFiles.map((f) =>
              uploadBufferToCloudinary(
                f.buffer,
                f.originalname,
                f.mimetype,
                "chatify/images"
              )
            )
          ),
          Promise.all(
            videoFiles.map((f) =>
              uploadBufferToCloudinary(
                f.buffer,
                f.originalname,
                f.mimetype,
                "chatify/videos"
              )
            )
          ),
          Promise.all(
            otherFiles.map((f) =>
              uploadBufferToCloudinary(
                f.buffer,
                f.originalname,
                f.mimetype,
                "chatify/files"
              )
            )
          ),
        ]);

      const imageUrls = uploadedImages.map((r) => {
        return { secure_url: r.secure_url, original_url: r.original_url };
      });
      const videoUrls = uploadedVideos.map((r) => {
        return { secure_url: r.secure_url, original_url: r.original_url };
      });
      const fileUrls = uploadedOthers.map((r) => {
        return { secure_url: r.secure_url, original_url: r.original_url };
      });

      const user = await User.findById(senderId).select(
        "-password -createdAt -updatedAt -__v"
      );
      const profile = await Profile.findOne({
        userId: senderId,
      }).select("-userId -_id -createdAt -updatedAt -__v");

      const newMessage = await Message.create({
        conversationId,
        senderId,
        content: text.trim() || "",
      });

      let attachments = {
        images: [],
        videos: [],
        files: [],
      };
      if (imageUrls.length > 0) {
        const imageAttachments = await Promise.all(
          imageUrls.map((item, i) =>
            MessageAttachment.create({
              messageId: newMessage._id,
              type: "image",
              content: item.secure_url,
              downloadUrl: item.original_url,
              fileName: imageFiles[i]?.originalname,
              mime: imageFiles[i]?.mimetype,
              bytes: imageFiles[i]?.size,
            })
          )
        );
        attachments.images.push(...imageAttachments);
      }

      if (videoUrls.length > 0) {
        const videoAttachments = await Promise.all(
          videoUrls.map((item, i) =>
            MessageAttachment.create({
              messageId: newMessage._id,
              type: "video",
              content: item.secure_url,
              downloadUrl: item.original_url,
              fileName: videoFiles[i]?.originalname,
              mime: videoFiles[i]?.mimetype,
              bytes: videoFiles[i]?.size,
            })
          )
        );
        attachments.videos.push(...videoAttachments);
      }

      if (fileUrls.length > 0) {
        const fileAttachments = await Promise.all(
          fileUrls.map((item, i) =>
            MessageAttachment.create({
              messageId: newMessage._id,
              type: "file",
              content: item.secure_url,
              downloadUrl: item.original_url,
              fileName: otherFiles[i]?.originalname,
              mime: otherFiles[i]?.mimetype,
              bytes: otherFiles[i]?.size,
            })
          )
        );
        attachments.files.push(...fileAttachments);
      }

      const fullDataNewMessage = {
        sender: {
          ...user.toObject(),
          profile: { ...profile.toObject() },
        },
        message: {
          ...newMessage.toObject(),
          attachments: { ...attachments },
        },
      };

      const receiverSocketIds = await getReceiverSocketIds(conversationId);

      if (receiverSocketIds.length > 0) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("newMessage", fullDataNewMessage);
        });
      }

      res.status(201).json({
        message: "Message sent successfully",
        data: fullDataNewMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    await SeenBy.create({
      messageId,
      userId: req.user.id,
    });

    return res.status(200).json({
      message: "Message marked as seen successfully",
      data: {},
    });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getVideoCallToken = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const token = generateStreamToken(currentUserId);

    return res.status(200).json({
      message: "Video call token generated successfully",
      data: { token },
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateConversationSettings = async (req, res) => {
  const { id: conversationId } = req.params;
  const { getNotifications, isPinned, language, translatedTo } = req.body;
  const userId = req.user._id;

  try {
    const updatedMySetting = await ConversationSetting.findOneAndUpdate(
      { conversationId, userId },
      { getNotifications, isPinned, language, translatedTo },
      { new: true }
    );
    if (!updatedMySetting) {
      return res
        .status(404)
        .json({ message: "Conversation setting not found" });
    }

    return res.status(200).json({
      message: "Conversation settings updated successfully",
      data: {
        conversation: {
          _id: conversationId,
          settings: updatedMySetting,
        },
      },
    });
  } catch (error) {
    console.error("Error updating conversation settings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAllMessagesAsSeen = async (req, res) => {
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

export const createGroup = async (req, res) => {
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

export const addMembersToGroup = async (req, res) => {
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

export const deleteMemberFromGroup = async (req, res) => {
  const conversationId = req.params.id;
  const { memberId } = req.query;
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

export const deleteConversation = async (req, res) => {
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

export const leaveGroup = async (req, res) => {
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
