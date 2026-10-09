import express from "express";
import {
  getAdminSummary,
  loginAdmin,
  getAdminDashboard,
  getSettings,
  updateSettings,
} from "../controllers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/summary", adminAuth, async (req, res) => {
  try {
    res.json(await getAdminSummary());
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.get("/dashboard", adminAuth, getAdminDashboard);
router.get("/settings", adminAuth, getSettings);
router.patch("/settings", adminAuth, updateSettings);

export default router;
