import express from "express";

import { getConversationsController } from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const chatRoute = express.Router();

chatRoute.use(protectedRoute);

chatRoute.get("/conversations", getConversationsController);

export default chatRoute;
