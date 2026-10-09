import express from "express";
import { getProviderRevenue } from "../controllers/paymentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/revenue", auth, getProviderRevenue);

export default router;
