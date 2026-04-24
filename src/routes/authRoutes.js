import express from "express";
import {
  getProfile,
  login,
  register,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", protect, getProfile);

export default router;