import express from "express";
import authRoutes from "./authrouter.js";
import serviceRoutes from "./serviceroutes.js";
import availabilityRoutes from "./avalibilityroute.js";
import integrationRoutes from "./integrationroutes.js";
import publicRoutes from "./publicroutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the BookMe!");
});

router.use("/auth", authRoutes);

router.use("/service", serviceRoutes);

router.use("/availability", availabilityRoutes);
router.use("/integrations", integrationRoutes);
router.use("/public", publicRoutes);

router.use("/admin", adminRoutes);

export default router;
