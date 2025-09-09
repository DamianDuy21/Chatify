import express from "express";
import {
  getMeController,
  loginController,
  logoutController,
  onboardController,
  resetPasswordController,
  signUpController,
  verifyResetPasswordOtpController,
  verifySignUpOtpController,
} from "../controllers/authController.js";
import { protectedRoute } from "../middleware/authMiddleware.js";

const authRoute = express.Router();

// signup
authRoute.post("/signup", signUpController);
authRoute.post("/signup/verify-otp", verifySignUpOtpController);

// reset password
authRoute.post("/reset-password", resetPasswordController);
authRoute.post("/reset-password/verify-otp", verifyResetPasswordOtpController);

// login, logout, onboard
authRoute.post("/login", loginController);
authRoute.post("/logout", protectedRoute, logoutController);
authRoute.post("/onboard", protectedRoute, onboardController);

// get me
authRoute.get("/me", protectedRoute, getMeController);

export default authRoute;
