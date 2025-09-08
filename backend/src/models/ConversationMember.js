import mongoose from "mongoose";

const conversationMemberSchema = new mongoose.Schema(
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
    isKeyMember: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  { timestamps: true }
);

const ConversationMember = mongoose.model(
  "ConversationMember",
  conversationMemberSchema
);

export default ConversationMember;
