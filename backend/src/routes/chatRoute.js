import express from "express";

import {
  addMembersToGroupController,
  createGroupController,
  deleteConversationController,
  deleteMemberFromGroupController,
  getConversationsController,
  leaveGroupController,
  markAllMessagesAsSeenController,
} from "../controllers/chatController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const chatRoute = express.Router();

// apply the protected route middleware to all user routes
chatRoute.use(protectedRoute);

chatRoute.post("/get-conversations", getConversationsController);
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
// chatRoute.post(
//   "/update-member-role-in-group/:id",
//   updateMemberRoleInGroupController
// );

export default chatRoute;
