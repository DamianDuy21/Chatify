import express from "express";
import {
  addMembersToGroup,
  createGroup,
  createUpdateReactBy,
  deleteConversation,
  deleteMemberFromGroup,
  deleteReactBy,
  getConversationMessages,
  getReactMemberList,
  getVideoCallToken,
  leaveGroup,
  markAllMessagesAsSeen,
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
chatRoute.post("/message/mark-all/:id", markAllMessagesAsSeen);

// group chat
chatRoute.post("/group", createGroup);
chatRoute.post("/group/members/:id", addMembersToGroup);
chatRoute.delete("/group/member/:id", deleteMemberFromGroup);
chatRoute.delete("/delete-conversation/:id", deleteConversation);
chatRoute.post("/leave-group/:id", leaveGroup);

// reaction
chatRoute.post("/message/reaction/:id", createUpdateReactBy);
chatRoute.delete("/message/reaction/:id", deleteReactBy);
chatRoute.post("/message/reaction/members/:id", getReactMemberList);

export default chatRoute;
