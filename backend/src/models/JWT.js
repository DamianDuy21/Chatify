import mongoose from "mongoose";

const jwtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      default: "",
      required: true,
    },

    expire_at: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

const JWT = mongoose.model("jwt", jwtSchema);

export default JWT;
