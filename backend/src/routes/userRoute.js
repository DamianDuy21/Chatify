import express from "express";
import {
  changePassword,
  deleteFriend,
  getFriends,
  getFriendsCouldBeAddedToGroup,
  getIncomingFriendRequests,
  getLanguages,
  getNotifications,
  getOutgoingFriendRequests,
  getRecommendedUsers,
  sendFriendRequest,
  updateFriendRequest,
  updateNotification,
  updateProfile,
  verifyChangePasswordOtp,
} from "../controllers/userController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const userRoute = express.Router();

userRoute.use(protectedRoute);

//update profile
userRoute.put("/profile", updateProfile);

//get languages
userRoute.get("/category/languages", getLanguages);

//change password
userRoute.post("/change-password", changePassword);
userRoute.post("/change-password/verify-otp", verifyChangePasswordOtp);

// get recommended users
userRoute.get("/recommend-users", getRecommendedUsers);

// friends
userRoute.get("/friends", getFriends);
userRoute.delete("/friend/:id", deleteFriend);
userRoute.get(
  "/friends/could-be-added-to-group/:id",
  getFriendsCouldBeAddedToGroup
);
userRoute.post("/friend-request/:id", sendFriendRequest);
userRoute.get("/friends/outgoing-friend-requests", getOutgoingFriendRequests);
userRoute.put("/friend-request/:id", updateFriendRequest);
userRoute.get("/friends/incoming-friend-requests", getIncomingFriendRequests);

userRoute.get("/notifications", getNotifications);
userRoute.put("/notification/:id", updateNotification);

export default userRoute;
