import express from "express";
import {
  getGoogleConnectUrl,
  handleGoogleCallback,
  disconnectGoogleCalendar,
  getGoogleConnectionStatus,
} from "../controllers/integrationController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/google/status", auth, getGoogleConnectionStatus);
router.get("/google/connect", auth, getGoogleConnectUrl);
router.get("/google/callback", handleGoogleCallback);
router.delete("/google/disconnect", auth, disconnectGoogleCalendar);

export default router;
