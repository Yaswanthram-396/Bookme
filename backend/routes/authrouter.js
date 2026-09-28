import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyRegistrationOtp } from "../controllers/authController.js";
import { requestRegistrationOtp } from "../controllers/authController.js";
import { updateProfile } from "../controllers/authController.js";
import { getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${(req.body?.email || "").toLowerCase()}`,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerUser);
router.post("/register/request-otp", otpLimiter, requestRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", authLimiter, loginUser);

router.post("/update-profile", auth, updateProfile);

router.get("/me", auth, getMe);
router.get("/profile", auth, getMe);

export default router;
