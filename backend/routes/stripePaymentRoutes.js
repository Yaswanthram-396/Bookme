import express from "express";
import rateLimit from "express-rate-limit";
import {
  createCheckoutSession,
  getPaymentStatus,
} from "../controllers/stripePaymentController.js";

const router = express.Router();

const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment attempts. Try again later.",
  },
});

// The webhook route lives in app.js: it needs the raw body, before express.json().
router.post("/create-checkout-session", checkoutLimiter, createCheckoutSession);
router.get("/status", getPaymentStatus);

export default router;
