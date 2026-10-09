import Booking from "../models/Booking.js";
import Service from "../models/service.js";
import User from "../models/User.js";
import { timeOverlap } from "../utils/overlap.js";
import {
  updateBookingCalendarEvent,
  cancelBookingCalendarEvent,
} from "../utils/googleCalender.js";
import { sendBookingNotification } from "../utils/bookingNotification.js";
import { refundMockPayment } from "./paymentController.js";

export const listBookings = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const bookings = await Booking.find(filter)
      .populate("serviceId", "name duration price")
      .sort({ date: -1, startTime: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("serviceId", "name duration price");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking already cancelled" });
    }

    booking.status = "cancelled";
    booking.active = false;
    booking.pendingExpiresAt = null;
    await booking.save();

    try {
      await refundMockPayment(booking);
    } catch (refundError) {
      console.error("Refund failed:", refundError.message);
    }

    const business = await User.findById(req.user.id);
    const service = await Service.findById(booking.serviceId);

    try {
      await cancelBookingCalendarEvent({ business, booking });
    } catch (calendarError) {
      console.error("Calendar cancellation failed:", calendarError.message);
    }

    sendBookingNotification({
      business,
      service: service || { name: "appointment" },
      booking,
      type: "cancelled",
    }).catch((emailError) =>
      console.error("Cancellation email failed:", emailError.message),
    );

    res.status(200).json({ success: true, message: "Booking cancelled", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rescheduleBooking = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ success: false, message: "date, startTime and endTime are required" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot reschedule a cancelled booking" });
    }

    const conflicting = await Booking.find({
      userId: req.user.id,
      date,
      active: true,
      _id: { $ne: booking._id },
    });
    const hasConflict = conflicting.some((existing) =>
      timeOverlap(startTime, endTime, existing.startTime, existing.endTime),
    );
    if (hasConflict) {
      return res.status(409).json({ success: false, message: "That slot is no longer available" });
    }

    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.isRescheduled = true;
    booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;

    try {
      await booking.save();
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(409).json({ success: false, message: "That slot is no longer available" });
      }
      throw saveError;
    }

    const business = await User.findById(req.user.id);
    const service = await Service.findById(booking.serviceId);

    try {
      const calendarResult = await updateBookingCalendarEvent({ business, service, booking });
      booking.googleEventId = calendarResult.googleEventId || booking.googleEventId;
      booking.customerCalendarUrl = calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
      await booking.save();
    } catch (calendarError) {
      console.error("Calendar update failed:", calendarError.message);
    }

    sendBookingNotification({
      business,
      service: service || { name: "appointment" },
      booking,
      type: "rescheduled",
    }).catch((emailError) =>
      console.error("Reschedule email failed:", emailError.message),
    );

    res.status(200).json({ success: true, message: "Booking rescheduled", booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
