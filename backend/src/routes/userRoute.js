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

// apply the protected route middleware to all user routes
userRoute.use(protectedRoute);

userRoute.put("/update-profile", updateProfileController);

userRoute.get("/category/get-languages", getLanguagesController);

userRoute.post("/change-password", changePasswordController);
userRoute.post(
  "/change-password/verify-otp",
  verifyChangePasswordOtpController
);

// get recommended users (not friends yet)
userRoute.post("/get-recommend-users", getRecommendedUsersController);

// get friends
userRoute.post("/get-friends", getFriendsController);
userRoute.post(
  "/friends/get-friends-could-be-added-to-group/:id",
  getFriendsCouldBeAddedToGroupController
);

// send friend request
userRoute.post("/send-friend-request/:id", sendFriendRequestController);

// get sent friend requests (not accepted yet)
userRoute.get(
  "/get-outgoing-friend-requests",
  getOutgoingFriendRequestsController
);

// update friend request
userRoute.put("/update-friend-request/:id", updateFriendRequestController);

// get friend requests and accepted requests
userRoute.get(
  "/get-incoming-friend-requests",
  getIncomingFriendRequestsController
);

userRoute.delete("/delete-friend/:id", deleteFriendController);

userRoute.get("/get-notifications", getNotificationsController);

userRoute.put("/update-notification/:id", updateNotificationController);

export default userRoute;
