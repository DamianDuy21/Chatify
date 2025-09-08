import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    pendingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PendingAccount",
      required: false,
    },
    pendingPasswordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PendingPassword",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    code: { type: String, required: true },
    type: {
      type: String,
      enum: ["signup", "change_password", "forgot_password"],
      required: true,
    },
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

otpSchema.index({ type: 1, status: 1, createdAt: -1 });

// Xoá khi hết hạn
otpSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("Otp", otpSchema);

export default OTP;
