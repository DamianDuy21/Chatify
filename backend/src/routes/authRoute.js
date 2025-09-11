import express from "express";
import {
  login,
  logout,
  me,
  onboard,
  resetPassword,
  signup,
  verifyResetPasswordOtp,
  verifySignUpOtp,
} from "../controllers/authController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const authRoute = express.Router();

// signup
authRoute.post("/signup", signup);
authRoute.post("/signup/verify-otp", verifySignUpOtp);

// reset password
authRoute.post("/reset-password", resetPassword);
authRoute.post("/reset-password/verify-otp", verifyResetPasswordOtp);

// login, logout, onboard
authRoute.post("/login", login);
authRoute.post("/logout", protectedRoute, logout);
authRoute.post("/onboard", protectedRoute, onboard);

// get me
authRoute.get("/me", protectedRoute, me);

export default authRoute;
