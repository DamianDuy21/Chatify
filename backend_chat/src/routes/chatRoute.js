import express from "express";
import {
  addMembersToGroupController,
  createGroupController,
  deleteConversationController,
  deleteMemberFromGroupController,
  getConversationFiles,
  getConversationMedia,
  getConversationMembers,
  getConversationMessages,
  getVideoCallToken,
  leaveGroupController,
  markAllMessagesAsSeenController,
  markMessageAsSeen,
  sendMessage,
  updateChatSettings,
} from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const chatRoute = express.Router();

chatRoute.use(protectedRoute);

chatRoute.get("/get-conversation-messages/:id", getConversationMessages);
// chatRoute.get("/get-conversation-members/:id", getConversationMembers);
// chatRoute.get("/get-conversation-media/:id", getConversationMedia);
// chatRoute.get("/get-conversation-files/:id", getConversationFiles);

chatRoute.put("/update-chat-settings/:id", updateChatSettings);

chatRoute.get("/video-call/get-token", getVideoCallToken);

chatRoute.post("/send-message/:id", sendMessage);

chatRoute.put("/mark-message-as-seen/:id", markMessageAsSeen);
chatRoute.post(
  "/mark-all-messages-as-seen/:id",
  markAllMessagesAsSeenController
);

chatRoute.post("/create-group", createGroupController);
chatRoute.post("/add-members-to-group/:id", addMembersToGroupController);
chatRoute.post(
  "/delete-member-from-group/:id",
  deleteMemberFromGroupController
);
chatRoute.delete("/delete-conversation/:id", deleteConversationController);
chatRoute.post("/leave-group/:id", leaveGroupController);

export default chatRoute;
