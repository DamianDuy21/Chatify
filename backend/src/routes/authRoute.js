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

authRoute.post("/signup", signUpController);
authRoute.post("/signup/verify-otp", verifySignUpOtpController);

authRoute.post("/reset-password", resetPasswordController);
authRoute.post("/reset-password/verify-otp", verifyResetPasswordOtpController);

authRoute.post("/login", loginController);
authRoute.post("/logout", protectedRoute, logoutController);

authRoute.post("/onboarding", protectedRoute, onboardController);

authRoute.get("/me", protectedRoute, getMeController);

export default authRoute;
