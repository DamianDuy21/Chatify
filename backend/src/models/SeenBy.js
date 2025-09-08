import mongoose from "mongoose";

const SeenBySchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

SeenBySchema.index({ messageId: 1, userId: 1 }, { unique: true });

const SeenBy = mongoose.model("SeenBy", SeenBySchema);

export default SeenBy;
