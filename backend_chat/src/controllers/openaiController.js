import { OpenAI } from "openai/client.js";
import { FLAG_TO_LANGUAGE } from "../lib/utils.js";
import multer from "multer";
import ConversationMember from "../models/ConversationMember.js";
import Conversation from "../models/Conversation.js";
import ConversationSetting from "../models/ConversationSetting.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Message from "../models/Message.js";
import MessageAttachment from "../models/MessageAttachment.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openaiCreateChatBot = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Kiểm tra xem đã có private conversation với chatbot chưa
    const conversationsMember1 = await ConversationMember.find({
      userId: currentUserId,
    });

    const chatbotConversationIds = await Conversation.find({
      type: "chatbot",
    }).distinct("_id");

    const match = conversationsMember1.find((m1) =>
      chatbotConversationIds.includes(m1.conversationId)
    );

    let conversation;
    let mySettings;
    if (match) {
      conversation = await Conversation.findOne({
        _id: match.conversationId,
        type: "chatbot",
      });
    } else {
      conversation = await Conversation.create({
        type: "chatbot",
        name: "Chatbot",
      });
      await ConversationMember.create({
        userId: currentUserId,
        conversationId: conversation._id,
      });
      mySettings = await ConversationSetting.create({
        conversationId: conversation._id,
        userId: currentUserId,
        getNotifications: false,
        isPinned: false,
        language: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
        translatedTo: new mongoose.Types.ObjectId("68b26fe629f59a1a322ae67c"),
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          ...conversation.toObject(),
          settings: { ...mySettings.toObject() },
        },
        users: [],
        messages: [],
        unSeenMessageQuantity: 0,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error creating chatbot:", error);
    return res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:openaiRoute.createChatBot.error"),
    });
  }
};

export const openaiTranslateMessage = async (req, res) => {
  try {
    const { text, targetLang, formality = "auto" } = req.body || {};
    if (!text || !targetLang) {
      return res.status(400).json({
        locale: req.i18n.language,
        message: req.t(
          "errors:openaiRoute.translateMessage.validation.missingTextOrTargetLang"
        ),
      });
    }

    const sourceLang = FLAG_TO_LANGUAGE[targetLang] || "English";

    const systemPrompt = `
      You are a professional translator.
      - Detect source language automatically.
      - Translate ONLY to ${sourceLang}.
      - Preserve line breaks.
      - Do NOT translate text inside backticks \`code\`, URLs, emails, HTML tags <...>, or {variables}.
      - If the text is already in ${sourceLang}, return it unchanged.
      - Formality: ${formality}.
      `.trim();

    const user = `TEXT:\n${text}`;

    // Responses API (SDK v4)
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: user },
      ],
    });

    // SDK v4 output_text
    const translated =
      response.output_text ?? response.output?.[0]?.content?.[0]?.text ?? "";

    res.json({ translated });
  } catch (error) {
    console.error("Error translating message:", error);
    res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:openaiRoute.translateMessage.error"),
    });
  }
};

export const openaiSendMessageChatbot = async (req, res) => {
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
        return res.status(400).json({
          locale: req.i18n.language,
          message: req.t(
            "errors:openaiRoute.sendMessageChatbot.validation.emptyTextMessage"
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
        message: req.t("errors:openaiRoute.sendMessageChatbot.error"),
      });
    }
  });
};

export const openaiResponseMessageChatbot = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { messageData, language } = req.body;
    const model = "gpt-4o-mini";

    const targetLanguage = FLAG_TO_LANGUAGE[language] || "English";

    const userMessage = {
      role: "user",
      content: messageData.message?.content || "",
    };

    const systemPrompt = {
      role: "system",
      content: `You are a helpful assistant. Always answer strictly in ${targetLanguage}. Do not switch languages.`,
    };

    const completion = await client.chat.completions.create({
      model,
      messages: [systemPrompt, userMessage],
    });

    const text = completion.choices?.[0]?.message?.content ?? "(no content)";

    const newMessage = await Message.create({
      conversationId,
      senderId: null,
      content: text.trim() || "",
    });

    const fullDataNewMessage = {
      sender: null,
      message: {
        ...newMessage.toObject(),
        attachments: null,
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
    console.error("Error responding to chatbot:", error);
    res.status(500).json({
      locale: req.i18n.language,
      message: req.t("errors:openaiRoute.responseMessageChatbot.error"),
    });
  }
};
