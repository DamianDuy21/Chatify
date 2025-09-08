import mongoose from "mongoose";

const messageAttachmentSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "file"],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mime: {
      type: String,
      required: true,
    },
    bytes: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const MessageAttachment = mongoose.model(
  "MessageAttachment",
  messageAttachmentSchema
);

export default MessageAttachment;
