import express from "express";

import {
  createPrivateConversation,
  getConversations,
  getConversationsHaveUnSeenMessages,
  getTotalConversationQuantityAboveFilter,
} from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const chatRoute = express.Router();

chatRoute.use(protectedRoute);

chatRoute.post("/conversation/private", createPrivateConversation);
chatRoute.get("/conversations", getConversations);
chatRoute.get("/conversations/total", getTotalConversationQuantityAboveFilter);
chatRoute.get(
  "/conversations/have-unseen-messages",
  getConversationsHaveUnSeenMessages
);

export default chatRoute;
