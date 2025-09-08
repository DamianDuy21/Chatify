import mongoose from "mongoose";

const conversationSettingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    getNotifications: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: true,
    },
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    translatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
  },
  { timestamps: true }
);

const ConversationSetting = mongoose.model(
  "ConversationSetting",
  conversationSettingSchema
);

export default ConversationSetting;
