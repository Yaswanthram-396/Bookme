import express from "express";
import {
  getAdminSummary,
  loginAdmin,
  getAdminDashboard,
} from "../controllers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/summary", adminAuth, getAdminSummary);
router.get("/dashboard", adminAuth, getAdminDashboard);

export default router;
