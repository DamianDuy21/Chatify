import express from "express";

import { protectedRoute } from "../middleware/auth.middleware.js";
import {
  openaiCreateChatBot,
  openaiResponseMessageChatbot,
  openaiSendMessageChatbot,
  openaiTranslateMessage,
} from "../controllers/openaiController.js";

const openaiRoute = express.Router();

openaiRoute.use(protectedRoute);

openaiRoute.post("/conversation", openaiCreateChatBot);

openaiRoute.post("/chat/translate", openaiTranslateMessage);

openaiRoute.post("/chat/send/:id", openaiSendMessageChatbot);
openaiRoute.post("/chat/wait/:id", openaiResponseMessageChatbot);

export default openaiRoute;
