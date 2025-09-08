import { truncates } from "bcryptjs";
import mongoose, { trusted } from "mongoose";

const pendingAccountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
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

pendingAccountSchema.index({ email: 1, status: 1, createdAt: -1 });

// Xoá khi hết hạn
pendingAccountSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 });

const PendingAccount = mongoose.model("PendingAccount", pendingAccountSchema);

export default PendingAccount;
