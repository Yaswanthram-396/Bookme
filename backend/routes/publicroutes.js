import express from "express";
import {
  getPublicBusiness,
  getPublicSlots,
  requestPublicBookingOtp,
  verifyPublicBookingOtp,
  createPublicBooking,
} from "../controllers/publicController.js";

import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${(req.body?.customerEmail || "").toLowerCase()}`,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

router.get("/:slug", getPublicBusiness);
router.get("/:slug/slots", getPublicSlots);

router.post("/:slug/request-otp", otpLimiter, requestPublicBookingOtp);
router.post("/:slug/verify-otp", verifyPublicBookingOtp);

router.post("/:slug/book", createPublicBooking);

export default router;
