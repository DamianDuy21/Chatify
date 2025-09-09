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

//update profile
userRoute.put("/profile", updateProfileController);

//get languages
userRoute.get("/category/languages", getLanguagesController);

//change password
userRoute.post("/change-password", changePasswordController);
userRoute.post(
  "/change-password/verify-otp",
  verifyChangePasswordOtpController
);

// get recommended users
userRoute.get("/recommend-users", getRecommendedUsersController);

// friends
userRoute.get("/friends", getFriendsController);
userRoute.delete("/friend/:id", deleteFriendController);
userRoute.get(
  "/friends/could-be-added-to-group/:id",
  getFriendsCouldBeAddedToGroupController
);
userRoute.post("/friend-request/:id", sendFriendRequestController);
userRoute.get(
  "/friends/outgoing-friend-requests",
  getOutgoingFriendRequestsController
);
userRoute.put("/friend-request/:id", updateFriendRequestController);
userRoute.get(
  "/friends/incoming-friend-requests",
  getIncomingFriendRequestsController
);

userRoute.get("/notifications", getNotificationsController);
userRoute.put("/notification/:id", updateNotificationController);

export default userRoute;
