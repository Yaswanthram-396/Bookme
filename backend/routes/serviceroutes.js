import express from "express";
import {
  createService,
  listService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, listService);
router.get("/", auth, createService);
router.get("/:id", auth, updateService);
router.get("/:id", auth, deleteService);
export default router;
