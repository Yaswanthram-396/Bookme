import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyRegistrationOtp } from "../controllers/authController.js";
import { requestRegistrationOtp } from "../controllers/authController.js";
import { updateProfile } from "../controllers/authController.js";
import { getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register/request-otp", requestRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", loginUser);

router.post("/update-profile", auth, updateProfile);

router.get("/me", auth, getMe);
router.get("/profile", auth, updateProfile);

export default router;
