import express from "express";
import {
  login,
  logout,
  onboard,
  signup,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  deleteAccount,
  getMe,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} from "../middleware/rateLimiter.js";
import {
  signupValidation,
  loginValidation,
  onboardingValidation,
  profileUpdateValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  handleValidationErrors,
} from "../lib/validation.js";

const router = express.Router();

// Authentication routes with rate limiting and validation
router.post("/signup", authLimiter, signupValidation, handleValidationErrors, signup);
router.post("/login", authLimiter, loginValidation, handleValidationErrors, login);
router.post("/logout", protectRoute, logout);

// Email verification routes
router.post("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  protectRoute,
  emailVerificationLimiter,
  resendVerificationEmail
);

// Password reset routes
router.post(
  "/forgot-password",
  passwordResetLimiter,
  passwordResetRequestValidation,
  handleValidationErrors,
  requestPasswordReset
);
router.post(
  "/reset-password",
  passwordResetValidation,
  handleValidationErrors,
  resetPassword
);

// User profile routes
router.post("/onboarding", protectRoute, onboardingValidation, handleValidationErrors, onboard);
router.put(
  "/update-profile",
  protectRoute,
  profileUpdateValidation,
  handleValidationErrors,
  updateProfile
);

// Account management
router.delete("/delete-account", protectRoute, deleteAccount);

// Check if user is logged in
router.get("/me", protectRoute, getMe);

export default router;
