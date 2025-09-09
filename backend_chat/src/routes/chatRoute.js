import express from "express";
import {
  addMembersToGroupController,
  createGroupController,
  deleteConversationController,
  deleteMemberFromGroupController,
  getConversationMessages,
  getVideoCallToken,
  leaveGroupController,
  markAllMessagesAsSeenController,
  markMessageAsSeen,
  sendMessage,
  updateConversationSettings,
} from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const chatRoute = express.Router();

chatRoute.use(protectedRoute);

chatRoute.get("/conversation/messages/:id", getConversationMessages);
// chatRoute.get("/get-conversation-members/:id", getConversationMembers);
// chatRoute.get("/get-conversation-media/:id", getConversationMedia);
// chatRoute.get("/get-conversation-files/:id", getConversationFiles);

// update conversation settings
chatRoute.put("/conversation/settings/:id", updateConversationSettings);

// get video call token
chatRoute.get("/video-call/token", getVideoCallToken);

// send message
chatRoute.post("/message/:id", sendMessage);

// mark message as seen
chatRoute.put("/message/mark/:id", markMessageAsSeen);
chatRoute.post("/messages/mark-all/:id", markAllMessagesAsSeenController);

// group chat
chatRoute.post("/group", createGroupController);
chatRoute.post("/group/members/:id", addMembersToGroupController);
chatRoute.delete("/group/member/:id", deleteMemberFromGroupController);
chatRoute.delete("/delete-conversation/:id", deleteConversationController);
chatRoute.post("/leave-group/:id", leaveGroupController);

export default chatRoute;
