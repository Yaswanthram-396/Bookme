import express from "express";
import {
  listBookings,
  getBooking,
  cancelBooking,
  rescheduleBooking,
} from "../controllers/bookingController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, listBookings);
router.get("/:id", auth, getBooking);
router.patch("/:id/cancel", auth, cancelBooking);
router.patch("/:id/reschedule", auth, rescheduleBooking);

export default router;
