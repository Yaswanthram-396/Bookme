import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

const createAdminToken = (email) => {
  return jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export const getAdminSummary = async () => {
  const [usersCount, bookingSummary] = await Promise.all([
    User.countDocuments(),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const totals = bookingSummary[0] || {};

  return {
    users: usersCount,
    bookings: totals.bookings || 0,
    pendingBookings: totals.pendingBookings || 0,
    confirmedBookings: totals.confirmedBookings || 0,
    cancelledBookings: totals.cancelledBookings || 0,
  };
};

const isAdminPasswordValid = (password) => {
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
  }
  return password === process.env.ADMIN_PASSWORD;
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (
      !adminEmail ||
      (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD)
    ) {
      return res.status(503).json({
        message: "Admin credentials not set in environment variables",
      });
    }
    if (!email || !password || email.toLowerCase().trim() !== adminEmail) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = isAdminPasswordValid(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.status(200).json({
      message: "Admin logged in successfully",
      token: createAdminToken(email),
      admin: { email: adminEmail },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// 551

export const getAdminDashboard = async (req, res) => {
  try {
    const [users, summary, recentBookings] = await Promise.all([
      User.find()
        .select("username email businessName slug payoutDetails createdAt")
        .sort({ createdAt: -1 })
        .limit(100),
      getAdminSummary(),
      Booking.find()
        .populate("userId", "username email businessName")
        .populate("serviceId", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      summary,
      users,
      withdrawals: [],
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
