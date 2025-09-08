import mongoose from "mongoose";

const pendingPasswordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    newPassword: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "verified", "expired"],
      default: "pending",
      index: true,
    },
    expire_at: { type: Date, required: true },
  },
  { timestamps: true }
);

pendingPasswordSchema.index({ email: 1, status: 1, createdAt: -1 });

// Xoá khi hết hạn
pendingPasswordSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 });

const PendingPassword = mongoose.model(
  "PendingPassword",
  pendingPasswordSchema
);

export default PendingPassword;
