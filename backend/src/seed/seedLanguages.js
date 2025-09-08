import mongoose from "mongoose";
import Language from "../models/Language.js";

const seeds = [
  { locale: "gb" }, // name: "Tiếng Anh"
  { locale: "es" }, // name: "Tiếng Tây Ban Nha"
  { locale: "fr" }, // name: "Tiếng Pháp"
  { locale: "de" }, // name: "Tiếng Đức"
  { locale: "cn" }, // name: "Tiếng Trung"
  { locale: "jp" }, // name: "Tiếng Nhật"
  { locale: "kr" }, // name: "Tiếng Hàn"
  { locale: "in" }, // name: "Tiếng Hindi"
  { locale: "ru" }, // name: "Tiếng Nga"
  { locale: "pt" }, // name: "Tiếng Bồ Đào Nha"
  { locale: "sa" }, // name: "Tiếng Ả Rập"
  { locale: "it" }, // name: "Tiếng Ý"
  { locale: "tr" }, // name: "Tiếng Thổ Nhĩ Kỳ"
  { locale: "nl" }, // name: "Tiếng Hà Lan"
  { locale: "vn" }, // name: "Tiếng Việt"
  { locale: "th" }, // name: "Tiếng Thái"
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Language.insertMany(seeds, { ordered: false });
    console.log("Seeded languages successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
