import express from "express";

import {
  findConversationsController,
  getConversationsController,
  getTotalConversationQuantityAboveFilter,
} from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const chatRoute = express.Router();

chatRoute.use(protectedRoute);

chatRoute.get("/conversations/find", findConversationsController);
chatRoute.get("/conversations", getConversationsController);
chatRoute.get("/conversations/total", getTotalConversationQuantityAboveFilter);

export default chatRoute;
