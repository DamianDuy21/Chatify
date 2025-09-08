import express from "express";
import {
  getConversationFiles,
  getConversationMedia,
  getConversationMembers,
  getMessages,
  getVideoCallToken,
  markMessageAsSeen,
  sendMessage,
  updateChatSettings,
} from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const chatRoute = express.Router();

chatRoute.use(protectedRoute);

chatRoute.get("/get-messages/:id", getMessages);
chatRoute.get("/get-members/:id", getConversationMembers);
chatRoute.get("/get-media/:id", getConversationMedia);
chatRoute.get("/get-files/:id", getConversationFiles);
chatRoute.post("/send-message/:id", sendMessage);
chatRoute.put("/mark-message-as-seen/:id", markMessageAsSeen);
chatRoute.put("/update-chat-settings/:id", updateChatSettings);

chatRoute.get("/video-call/get-token", getVideoCallToken);

export default chatRoute;
