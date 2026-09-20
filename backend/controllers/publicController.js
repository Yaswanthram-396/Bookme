import Booking from "../models/Booking.js";
import Service from "../models/service.js";
import User from "../models/User.js";

import { buildCustomerCalenderUrl } from "../utils/calenderlink.js";
import { createBookingCalendarEvent } from "../utils/googleCalender.js";
import { sendBookingNotification } from "../utils/bookingNotification.js";

import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
import { generateSlots } from "../utils/slotGenerator.js";

import { timeOverlap } from "../utils/overlap.js";

const getBusinessBySlug = async (slug) => {
  return User.findOne({ slug }).select("-password");
};

const toPublicBusiness = (business) => ({
  id: business._id,
  name: business.name,
  slug: business.slug,
  business: business.businessName,
  businessDescription: business.businessDescription,
  brandTheme: business.brandTheme,
  brandAccent: business.brandAccent,
  timezone: business.timezone,
  googleCalendarConnected: business.googleCalendarConnected,
});

const findActiveSlotBookings = ({ userId, date }) => {
  return Booking.find({
    userId,
    date,
    status: "confirmed",
  });
};

export const getPublicBusiness = async (req, res) => {
  try {
    const business = await getBusinessBySlug(req.params.slug);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const services = await Service.find({
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    }).sort({ name: 1 });

    res.json({
      business: toPublicBusiness(business),
      services,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPublicSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    if (!date || !serviceId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }
    const bisiness = await getBusinessBySlug(req.params.slug);
    if (!bisiness) {
      return res.status(404).json({ message: "Business not found" });
    }
    const service = await Service.findById({
      _id: serviceId,
      userId: bisiness._id,
      isDeleted: { $ne: true },
      isActive: true,
    });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    const slots = await generateSlots(bisiness._id, service, date);
    return res.status(200).json({ slots });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const requestPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail } = req.body;
    const normalizedEmail = customerEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    const business = await getBusinessBySlug(req.params.slug);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    const otp = await requestEmailOtp({
      email: normalizedEmail,
      purpose: "booking",
    });
    res.status(200).json({
      message: "OTP sent successfully",
      email: normalizedEmail,
      otpResponse: otp,
    });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const verifyPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail, emailOtp } = req.body;

    if (!customerEmail || !emailOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpResult = await verifyEmailOtp({
      email: customerEmail,
      purpose: "booking",
      code: emailOtp,
      consume: false,
    });

    if (!otpResult.verified) {
      return res
        .status(400)
        .json({ message: otpResult.reason || "Invalid OTP" });
    }

    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createPublicBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerAvatar,
      date,
      startTime,
      endTime,
      notes,
      emailOtp,
    } = req.body;

    if (
      !serviceId ||
      !customerName ||
      !customerEmail ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return res
        .status(400)
        .json({ message: "All booking fields are required" });
    }

    const normalizedCustomerEmail = customerEmail.toLowerCase().trim();

    const business = await getBusinessBySlug(req.params.slug);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const bookings = await findActiveSlotBookings({
      userId: business._id,
      date,
    });

    const hasConflict = bookings.some((booking) =>
      timeOverlap(startTime, endTime, booking.startTime, booking.endTime),
    );

    if (hasConflict) {
      return res
        .status(409)
        .json({ message: "That slot is no longer available" });
    }

    const otpResult = await verifyEmailOtp({
      email: normalizedCustomerEmail,
      purpose: "booking",
      code: emailOtp,
      consume: true,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Email verification is required",
      });
    }

    const customerCalendarUrl = buildCustomerCalenderUrl({
      business,
      service,
      booking: {
        date,
        startTime,
        endTime,
        customerName,
        customerEmail: normalizedCustomerEmail,
        notes,
      },
    });

    const booking = await Booking.create({
      userId: business._id,
      serviceId,
      customerName,
      customerEmail: normalizedCustomerEmail,
      customerAvatar: customerAvatar || "A1.png",
      date,
      startTime,
      endTime,
      notes: notes || "",
      amount: 0,
      payoutStatus: "not_required",
      paymentStatus: "not_required",
      status: "confirmed",
      customerCalendarUrl,
    });

    try {
      const calendarResult = await createBookingCalendarEvent({
        business,
        service,
        booking,
      });
      booking.googleEventId = calendarResult.googleEventId || "";
      booking.customerCalendarUrl = calendarResult.customerCalendarUrl;
      await booking.save();
    } catch (calendarError) {
      booking.customerCalendarUrl = customerCalendarUrl;
      await booking.save();
    }

    sendBookingNotification({
      business,
      service,
      booking,
      type: "confirmed",
    }).catch((emailError) =>
      console.error("Booking confirmation email failed:", emailError.message),
    );

    return res.status(201).json({
      message: "Booking confirmed",
      booking,
      customerCalendarUrl: booking.customerCalendarUrl,
      email: { sent: "processing" },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Server error: " + error.message,
      error: error.message,
    });
  }
};
