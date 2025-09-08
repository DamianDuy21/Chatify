import mongoose from "mongoose";

const ReactBySchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike", "heart"],
      required: true,
    },
  },
  { timestamps: true }
);

const ReactBy = mongoose.model("ReactBy", ReactBySchema);

export default ReactBy;
