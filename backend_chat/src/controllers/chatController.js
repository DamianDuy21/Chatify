import cloudinary from "../lib/cloudinary.js";
import multer from "multer";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import ConversationSetting from "../models/ConversationSetting.js";
import Language from "../models/Language.js";
import Message from "../models/Message.js";
import MessageAttachment from "../models/MessageAttachment.js";
import Profile from "../models/Profile.js";
import SeenBy from "../models/SeenBy.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { generateStreamToken } from "../lib/stream.js";

export const getMessages = async (req, res) => {
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

export const updateChatSettings = async (req, res) => {
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
