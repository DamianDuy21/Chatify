import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import { generateStreamToken } from "../lib/stream.js";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import ConversationSetting from "../models/ConversationSetting.js";
import Message from "../models/Message.js";
import MessageAttachment from "../models/MessageAttachment.js";
import Notification from "../models/Notification.js";
import Profile from "../models/Profile.js";
import SeenBy from "../models/SeenBy.js";
import User from "../models/User.js";
import ReactBy from "../models/ReactBy.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";

export const getConversationMessages = async (req, res) => {
  try {
    const currentUserId = req.user?._id;
    const conversationId = req.params.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 16));

    const { lastMessageId } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.getConversationMessages.validation.conversationNotFound"
        ),
      });
    }

    let messages;
    let anchor = null;

    if (lastMessageId) {
      anchor = await Message.findOne({ _id: lastMessageId, conversationId });
      if (!anchor) {
        return res.status(400).json({
          locale: req.i18n.language,
          message: req.t(
            "errors:chatRoute.getConversationMessages.validation.invalidLastMessageId"
          ),
        });
      }

      messages = await Message.find({
        conversationId,
        createdAt: { $lt: anchor.createdAt },
      })
        .sort({ createdAt: -1 })
        .limit(limit);
    } else {
      const offset = (page - 1) * limit;
      messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
    }

    const sortedMessages = [...messages].reverse();

    const fullDataMessages = await Promise.all(
      sortedMessages.map(async (message) => {
        const sender = await User.findById(message.senderId).select(
          "-password -createdAt -updatedAt -__v"
        );
        const profileSender = await Profile.findOne({
          userId: message.senderId,
        }).select("-userId -_id -createdAt -updatedAt -__v");

        // seen by
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
              user: {
                ...user.toObject(),
                profile: {
                  ...profile.toObject(),
                },
              },
            };
          })
        );

        // react by
        const reactionTypes = ["like", "dislike", "heart"];
        const reactionResults = await Promise.all(
          reactionTypes.map((t) =>
            ReactBy.find({ messageId: message._id, type: t }).lean()
          )
        );
        const reactionQuantity = {};
        const myReactionQuantity = {};
        reactionTypes.forEach((t, index) => {
          const arr = reactionResults[index] || [];

          reactionQuantity[t] = arr;

          myReactionQuantity[t] = arr.filter(
            (r) => String(r.userId) === String(currentUserId)
          ).length;
        });

        if (!sender) {
          return {
            sender: null,
            message: {
              ...message.toObject(),
              attachments: {
                images: [],
                videos: [],
                files: [],
              },
            },
            seenBy: fullDataSeenBy,
            reactions: {
              total: reactionQuantity,
              my: myReactionQuantity,
            },
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
              images: [],
              videos: [],
              files: [],
            },
          },
          seenBy: fullDataSeenBy,
          reactions: {
            total: reactionQuantity,
            my: myReactionQuantity,
          },
        };
      })
    );

    return res.status(200).json({
      message: "",
      data: {
        conversation: {
          messages: fullDataMessages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.getConversationMessages.error"),
    });
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
      message: "",
      data: {
        members: fullDataMembers,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation members:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.getConversationMembers.error"),
    });
  }
};

export const getConversationMedia = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
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
      message: "",
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
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
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
      message: "",
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
    { name: "images", maxCount: 12 },
    { name: "videos", maxCount: 6 },
    { name: "files", maxCount: 12 },
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

  upload(req, res, async (multerError) => {
    if (multerError) {
      console.error("multer error:", multerError);
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
        return res.status(400).json({
          locale: req.i18n.language,
          message: req.t(
            "errors:chatRoute.sendMessage.validation.emptyTextMessage"
          ),
        });
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
        reactions: {
          total: { like: [], dislike: [], heart: [] },
          my: { like: 0, dislike: 0, heart: 0 },
        },
      };

      const receiverSocketIds = await getReceiverSocketIds(conversationId);
      if (receiverSocketIds.length > 0) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("newMessage", fullDataNewMessage);
        });
      }

      res.status(201).json({
        message: "",
        data: fullDataNewMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({
        locale: req.i18n.language,
        message: req.t("errors:chatRoute.sendMessage.error"),
      });
    }
  });
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.markMessageAsSeen.validation.messageNotFound"
        ),
      });
    }
    await SeenBy.create({
      messageId,
      userId: req.user.id,
    });

    const receiverSocketIds = await getReceiverSocketIds(
      message.conversationId
    );

    if (receiverSocketIds.length > 0) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("markMessageAsSeen", {
          messageId,
          userId: req.user.id,
          conversationId: message.conversationId,
        });
      });
    }

    return res.status(200).json({
      message: "",
      data: {},
    });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.markMessageAsSeen.error"),
    });
  }
};

export const getVideoCallToken = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const token = generateStreamToken(currentUserId);

    return res.status(200).json({
      message: "",
      data: { token },
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.getVideoCallToken.error"),
    });
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
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.updateConversationSettings.validation.settingsNotFound"
        ),
      });
    }

    return res.status(200).json({
      message: "",
      data: {
        conversation: {
          _id: conversationId,
          settings: updatedMySetting,
        },
      },
    });
  } catch (error) {
    console.error("Error updating conversation settings:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.updateConversationSettings.error"),
    });
  }
};

export const markAllMessagesAsSeen = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.markAllMessagesAsSeen.validation.invalidMemberData"
        ),
      });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.markAllMessagesAsSeen.validation.conversationNotFound"
        ),
      });
    }
    const messageIds = await Message.distinct("_id", {
      conversationId,
      senderId: { $ne: currentUserId },
    });

    if (!messageIds.length) {
      return res.status(200).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.markAllMessagesAsSeen.validation.noMessagesToMark"
        ),
        inserted: 0,
      });
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

    const receiverSocketIds = await getReceiverSocketIds(conversationId);

    if (receiverSocketIds.length > 0) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("markAllMessagesAsSeen", {
          userId: req.user.id,
          conversationId,
        });
      });
    }

    return res.status(200).json({
      message: "",
      data: {
        total: {
          messages: messageIds.length,
          inserted: insertedCount,
        },
      },
    });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.markAllMessagesAsSeen.error"),
    });
  }
};

export const createGroup = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { name, memberIds } = req.body;

    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.createGroup.validation.allFieldsRequired"
        ),
      });
    }

    const notificationMembers = memberIds.filter((id) => id != currentUserId);

    const notifications = notificationMembers.map((memberId) => ({
      userIdRef: currentUserId,
      userId: memberId,
      content: `add_to_group-${name}`,
      status: "pending",
    }));

    // Tạo thông báo
    const createGroupNotifications = await Notification.insertMany(
      notifications
    );

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
          conversation: {
            ...newGroup.toObject(),
            lastMessage: null,
            settings: mySetting,
          },
          messages: [],
          users: fullDataMembers,
          unSeenMessageQuantity: 0,
        },

        notifications: createGroupNotifications,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.createGroup.error"),
    });
  }
};

export const addMembersToGroup = async (req, res) => {
  const currentUserId = req.user._id;
  const conversationId = req.params.id;
  const { memberIds } = req.body;
  try {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.addMembersToGroup.validation.invalidMemberData"
        ),
      });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.addMembersToGroup.validation.groupNotFound"
        ),
      });
    }
    const existingMemberIds = await ConversationMember.find({
      conversationId,
    }).distinct("userId");

    const newMemberIds = memberIds.filter(
      (id) => !existingMemberIds.includes(id)
    );
    if (newMemberIds.length === 0) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.addMembersToGroup.validation.alreadyMember"
        ),
      });
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

    const notificationMembers = memberIds.filter((id) => id != currentUserId);

    const notifications = notificationMembers.map((memberId) => ({
      userIdRef: currentUserId,
      userId: memberId,
      content: `add_to_group-${conversation.name}`,
      status: "pending",
    }));

    // Tạo thông báo
    const addMembersToGroupNotifications = await Notification.insertMany(
      notifications
    );

    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          conversation: {
            ...conversation.toObject(),
            lastMessage: null,
            settings: null,
          },
          users: fullDataNewMembers,
          unSeenMessageQuantity: 0,
        },
        notifications: addMembersToGroupNotifications,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error adding members to group:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.addMembersToGroup.error"),
    });
  }
};

export const deleteMemberFromGroup = async (req, res) => {
  const currentUserId = req.user._id;
  const conversationId = req.params.id;
  const { memberId } = req.query;
  try {
    if (!memberId) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteMemberFromGroup.validation.invalidMemberData"
        ),
      });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteMemberFromGroup.validation.groupNotFound"
        ),
      });
    }
    const member = await ConversationMember.findOne({
      conversationId,
      userId: memberId,
    });
    if (!member) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteMemberFromGroup.validation.memberNotInGroup"
        ),
      });
    }

    await ConversationMember.deleteOne({ _id: member._id });
    await ConversationSetting.deleteOne({
      conversationId,
      userId: memberId,
    });

    const notifications = [
      {
        userIdRef: currentUserId,
        userId: memberId,
        content: `delete_from_group-${conversation.name}`,
        status: "pending",
      },
    ];

    // Tạo thông báo
    const createGroupNotifications = await Notification.insertMany(
      notifications
    );

    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          conversation: {
            ...conversation.toObject(),
            lastMessage: null,
            settings: null,
          },
          user: {
            _id: memberId,
          },
        },
        notifications: createGroupNotifications,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error deleting member from group:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.deleteMemberFromGroup.error"),
    });
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
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteConversation.validation.invalidMemberData"
        ),
      });
    }

    const conversation = await Conversation.findById(conversationId).session(
      session
    );
    const otherMemberIds = await ConversationMember.find({
      conversationId,
      userId: { $ne: currentUserId },
    })
      .distinct("userId")
      .session(session);
    if (!conversation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteConversation.validation.conversationNotFound"
        ),
      });
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
            ...conversation.toObject(),
            lastMessage: null,
            settings: null,
          },
          users: [
            {
              user: {
                _id: otherMemberIds[0],
              },
            },
          ],
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
      const memberIds = await ConversationMember.find({ conversationId })
        .distinct("userId")
        .session(session);

      const notificationMembers = memberIds.filter(
        (id) => id.toString() !== currentUserId.toString()
      );

      const notifications = notificationMembers.map((memberId) => ({
        userIdRef: currentUserId,
        userId: memberId,
        content: `delete_group-${conversation.name}`,
        status: "pending",
      }));

      const createGroupNotifications = await Notification.insertMany(
        notifications,
        { session }
      );

      const stats = await deleteWholeConversation();
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        success: true,
        message: "",
        data: {
          conversation: {
            ...stats.data,
          },
          notifications: createGroupNotifications,
        },
      });
    }

    // ===== Case 2: PRIVATE =====
    const memberIds = await ConversationMember.find({ conversationId })
      .distinct("userId")
      .session(session);

    const otherMemberId = memberIds.find(
      (id) => id.toString() !== currentUserId.toString()
    );

    const notifications = [
      {
        userIdRef: currentUserId,
        userId: otherMemberId,
        content: `delete_private_conversation`,
        status: "pending",
      },
    ];

    const createGroupNotifications = await Notification.insertMany(
      notifications,
      { session }
    );

    if (!otherMemberId) {
      const stats = await deleteWholeConversation();
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "",
        ...stats,
      });
    }

    const stats = await deleteWholeConversation();

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          ...stats.data,
        },
        notifications: createGroupNotifications,
      },

      message: "",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting conversation:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.deleteConversation.error"),
    });
  }
};

export const leaveGroup = async (req, res) => {
  const conversationId = req.params.id;
  const currentUserId = req.user?._id;

  const { isKeyMember = false, newKeyMemberId = null } = req.body || {};

  if (!currentUserId) {
    return res.status(400).json({
      locale: req.i18n.language,
      message: req.t(
        "errors:chatRoute.leaveGroup.validation.invalidMemberData"
      ),
    });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const conversation = await Conversation.findById(conversationId).session(
        session
      );
      if (!conversation || conversation.type !== "group") {
        throw {
          status: 404,
          locale: req.i18n.language,
          message: req.t(
            "errors:chatRoute.leaveGroup.validation.groupNotFound"
          ),
        };
      }

      const leavingMember = await ConversationMember.findOne({
        conversationId,
        userId: currentUserId,
      }).session(session);

      if (!leavingMember) {
        throw {
          status: 404,
          locale: req.i18n.language,
          message: req.t(
            "errors:chatRoute.leaveGroup.validation.memberNotFoundInGroup"
          ),
        };
      }

      if (isKeyMember === true) {
        if (!newKeyMemberId) {
          throw {
            status: 400,
            locale: req.i18n.language,
            message: req.t(
              "errors:chatRoute.leaveGroup.validation.newKeyMemberRequired"
            ),
          };
        }
        if (String(newKeyMemberId) === String(currentUserId)) {
          throw {
            status: 400,
            locale: req.i18n.language,
            message: req.t(
              "errors:chatRoute.leaveGroup.validation.newKeyMemberNotYourself"
            ),
          };
        }

        const receiver = await ConversationMember.findOne({
          conversationId,
          userId: newKeyMemberId,
        }).session(session);

        if (!receiver) {
          throw {
            status: 404,
            locale: req.i18n.language,
            message: req.t(
              "errors:chatRoute.leaveGroup.validation.newKeyMemberNotInGroup"
            ),
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
        message: "",
      });
    });
  } catch (error) {
    console.error("LeaveGroupController error:", error);
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (error) {
        console.error("Error aborting transaction:", error);
      }
    }
    const status = error?.status || 500;
    const message =
      error?.message || req.t("errors:chatRoute.leaveGroup.error");
    return res.status(status).json({ message });
  } finally {
    session.endSession();
  }
};

export const createUpdateReactBy = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { type, conversationId } = req.body;
    const userId = req.user._id;
    if (!["like", "dislike", "heart"].includes(type)) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.createUpdateReactBy.validation.invalidReactionType"
        ),
      });
    }
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.createUpdateReactBy.validation.messageNotFound"
        ),
      });
    }
    const receiverSocketIds = await getReceiverSocketIds(conversationId);
    const existingReact = await ReactBy.findOne({ messageId, userId });
    if (existingReact) {
      existingReact.type = type;
      await existingReact.save();
      if (receiverSocketIds.length > 0) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("newReaction", {
            conversationId,
            messageId,
            reactBy: existingReact,
            reaction: type,
            createUpdateUserId: userId,
          });
        });
      }
      return res.status(200).json({
        message: "",
        data: { reactBy: existingReact },
      });
    } else {
      const newReact = await ReactBy.create({ messageId, userId, type });

      if (receiverSocketIds.length > 0) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("newReaction", {
            conversationId,
            messageId,
            reactBy: newReact,
            reaction: type,
            createUpdateUserId: userId,
          });
        });
      }
      return res.status(201).json({
        message: "",
        data: { reactBy: newReact },
      });
    }
  } catch (error) {
    console.error("Error in createUpdateReactBy:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.createUpdateReactBy.error"),
    });
  }
};
export const deleteReactBy = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { type, conversationId } = req.query;
    console.log("type", type);
    console.log("conversationId", conversationId);
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteReactBy.validation.messageNotFound"
        ),
      });
    }
    const receiverSocketIds = await getReceiverSocketIds(conversationId);
    const existingReact = await ReactBy.findOne({ messageId, userId });
    if (!existingReact) {
      return res.status(404).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.deleteReactBy.validation.reactionNotFound"
        ),
      });
    }
    await ReactBy.deleteOne({ _id: existingReact._id });
    if (receiverSocketIds.length > 0) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("deleteReaction", {
          conversationId,
          messageId,
          reactBy: existingReact,
          reaction: type,
          deleteUserId: userId,
        });
      });
    }
    return res.status(200).json({
      message: "",
      data: {},
    });
  } catch (error) {
    console.error("Error in deleteReactBy:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.deleteReactBy.error"),
    });
  }
};

export const getReactMemberList = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: messageId } = req.params;
    const { memberInGroupIds, conversationType, keyMemberId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      throw {
        status: 404,
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.getReactMemberList.validation.messageNotFound"
        ),
      };
    }

    const reactions = await ReactBy.find({ messageId });
    if (!reactions || reactions.length === 0) {
      throw {
        status: 404,
        locale: req.i18n.language,
        message: req.t(
          "errors:chatRoute.getReactMemberList.validation.reactionNotFound"
        ),
      };
    }

    const memberInGroupIdSet = new Set(
      (memberInGroupIds || []).map((id) => id && id.toString())
    );

    const grouped = {
      like: [],
      dislike: [],
      heart: [],
    };

    await Promise.all(
      reactions.map(async (reaction) => {
        try {
          if (!reaction.userId) return;

          let userObj;

          if (memberInGroupIdSet.has(reaction.userId.toString())) {
            userObj = {
              user: {
                _id: reaction.userId.toString(),
              },
            };
          } else {
            const profile = await Profile.findOne({
              userId: reaction.userId,
            }).select("-userId -_id -createdAt -updatedAt -__v");
            if (!profile) return null;

            const user = await User.findById(reaction.userId).select(
              "-password -createdAt -updatedAt -__v"
            );
            if (!user) return null;

            let isFriend;
            let isSendFriendRequest;

            userObj = {
              user: {
                ...user.toObject(),
                profile: {
                  ...profile.toObject(),
                },
              },
            };

            if (conversationType === "group") {
              isFriend = await Friend.findOne({
                $or: [
                  { firstId: currentUserId, secondId: reaction.userId },
                  { firstId: reaction.userId, secondId: currentUserId },
                ],
              });
              isSendFriendRequest = await FriendRequest.findOne({
                $or: [
                  { senderId: currentUserId, recipientId: reaction.userId },
                  { senderId: reaction.userId, recipientId: currentUserId },
                ],
                status: "pending",
              });

              if (keyMemberId) {
                userObj.isKeyMember = keyMemberId == reaction.userId.toString();
                userObj.isFriend = Boolean(isFriend);
                userObj.isSendFriendRequest = Boolean(isSendFriendRequest);
              }
            }
          }

          const type = (reaction.type || "").toString();
          if (type === "like" || type === "dislike" || type === "heart") {
            grouped[type].push(userObj);
          } else {
            grouped.heart.push(userObj);
          }
        } catch (innerError) {
          console.error("Error processing reaction:", reaction._id, innerError);
        }
      })
    );

    return res.status(200).json({
      message: "",
      data: {
        success: true,
        users: grouped,
      },
    });
  } catch (error) {
    console.error("Error in getReactMemberList:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:chatRoute.getReactMemberList.error"),
    });
  }
};
