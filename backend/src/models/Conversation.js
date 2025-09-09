import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      default: "",
    },
    type: {
      type: String,
      enum: ["private", "group", "chatbot"],
      required: true,
      index: true,
    },
    // sortTimestamp: {
    //   type: Date,
    //   default: Date.now,
    //   index: true,
    // },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
