import express from "express";
import {
  changePasswordController,
  deleteFriendController,
  getFriendsController,
  getFriendsCouldBeAddedToGroupController,
  getIncomingFriendRequestsController,
  getLanguagesController,
  getNotificationsController,
  getOutgoingFriendRequestsController,
  getRecommendedUsersController,
  sendFriendRequestController,
  updateFriendRequestController,
  updateNotificationController,
  updateProfileController,
  verifyChangePasswordOtpController,
} from "../controllers/userController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const userRoute = express.Router();

userRoute.use(protectedRoute);

userRoute.put("/update-profile", updateProfileController);

userRoute.get("/category/get-languages", getLanguagesController);

userRoute.post("/change-password", changePasswordController);
userRoute.post(
  "/change-password/verify-otp",
  verifyChangePasswordOtpController
);

userRoute.post("/get-recommend-users", getRecommendedUsersController);

userRoute.post("/get-friends", getFriendsController);
userRoute.delete("/delete-friend/:id", deleteFriendController);
userRoute.post(
  "/get-friends-could-be-added-to-group/:id",
  getFriendsCouldBeAddedToGroupController
);
userRoute.post("/send-friend-request/:id", sendFriendRequestController);
userRoute.get(
  "/get-outgoing-friend-requests",
  getOutgoingFriendRequestsController
);
userRoute.put("/update-friend-request/:id", updateFriendRequestController);
userRoute.get(
  "/get-incoming-friend-requests",
  getIncomingFriendRequestsController
);

userRoute.get("/get-notifications", getNotificationsController);
userRoute.put("/update-notification/:id", updateNotificationController);

export default userRoute;
