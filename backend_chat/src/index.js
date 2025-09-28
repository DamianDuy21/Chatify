// import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";

import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./lib/db.js";

// import path from "path";
import { app, server } from "./lib/socket.js";
import chatRoute from "./routes/chatRoute.js";
import openaiRoute from "./routes/openaiRoute.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, "./locales"); // -> ./locales/en/*.json, ./locales/vi/*.json

await i18next.use(Backend).init({
  fallbackLng: "vi",
  supportedLngs: ["en", "vi"],
  preload: ["en", "vi"],
  ns: ["errors"],
  defaultNS: "errors",
  backend: {
    loadPath: path.join(localesDir, "{{lng}}/{{ns}}.json"),
  },
  interpolation: { escapeValue: false },
  debug: process.env.NODE_ENV !== "production",
});

const corsAllNoCred = {
  origin: true,
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Locale", "Accept"],
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsAllNoCred));
app.options("*", cors(corsAllNoCred));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(cookieParser());

app.use(i18nextMiddleware.handle(i18next));

app.use((req, _res, next) => {
  const x = req.header("X-Locale");
  if (x) {
    const short = x.toLowerCase().split("-")[0];
    if (["en", "vi"].includes(short)) {
      req.i18n.changeLanguage(short);
    }
  }
  next();
});

app.use("/api/chat", chatRoute);
app.use("/api/openai", openaiRoute);

// app.use((_req, res) => {
//   res.status(404).json({
//     code: "NOT_FOUND",
//     message: "Endpoint not found",
//     locale: "en"
//   });
// });
// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(500).json({
//     code: "INTERNAL_ERROR",
//     message: "Internal server error",
//     locale: "en"
//   });
// });

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
