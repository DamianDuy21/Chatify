import express from "express";
import {
  openaiCreateChatBot,
  openaiResponseMessageChatbot,
  openaiSendMessageChatbot,
  openaiTranslateMessage,
} from "../controllers/openaicontroller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const openaiRoute = express.Router();

openaiRoute.use(protectedRoute);

openaiRoute.post("/create-chatbot", openaiCreateChatBot);

openaiRoute.post("/translate-message", openaiTranslateMessage);

openaiRoute.post("/chat/send-message/:id", openaiSendMessageChatbot);
openaiRoute.post("/chat/wait-message/:id", openaiResponseMessageChatbot);

export default openaiRoute;
