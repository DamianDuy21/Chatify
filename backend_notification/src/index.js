import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// import path from "path";
import { app, server } from "./lib/socket.js";
dotenv.config();

const PORT = process.env.PORT || 8001;

// const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../front-end/dist")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../front-end/dist/index.html"));
//   });
// }

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
