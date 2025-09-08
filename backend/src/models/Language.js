import mongoose from "mongoose";

const languageSchema = new mongoose.Schema(
  {
    locale: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z]{2}$/,
    },
  },
  { timestamps: true }
);

const Language = mongoose.model("Language", languageSchema);

export default Language;
