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
router.post("/", auth, createService);
router.patch("/:id", auth, updateService);
router.delete("/:id", auth, deleteService);
export default router;
