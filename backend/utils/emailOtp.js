import bcrypt from "bcryptjs";
import crypto from "crypto";
import EmailOtp from "../models/Emailotp.js";
import { sendOtpNotification } from "./bookingNotification.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const normalizeEmail = (email = "") => email.toLowerCase().trim();

const createCode = () => crypto.randomInt(100000, 1000000).toString();

export const requestEmailOtp = async ({ email, purpose }) => {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error("Email is required");
  }
  const code = createCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await EmailOtp.deleteMany({
    email: normalized,
    purpose,
    consumedAt: null,
  });
  await EmailOtp.create({
    email: normalized,
    purpose,
    codeHash,
    expiresAt,
  });

  let emailDelivered = true;
  try {
    await sendOtpNotification({ email: normalized, code, purpose });
  } catch (sendError) {
    if (process.env.NODE_ENV === "production") {
      throw sendError;
    }
    emailDelivered = false;
    console.warn(
      `[dev] Email delivery failed (${sendError.message}). OTP for ${normalized} (${purpose}): ${code}`,
    );
  }

  return {
    sent: true,
    emailDelivered,
    email: normalized,
    expiresInMinutes: OTP_TTL_MINUTES,
  };
};

export const verifyEmailOtp = async ({
  email,
  purpose,
  code,
  consume = false,
}) => {
  const normalized = normalizeEmail(email);
  if (!normalized || !code) {
    return { verified: false, reason: "Email and OTP are required" };
  }
  const record = await EmailOtp.findOne({
    email: normalized,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!record) {
    return { verified: false, reason: "OTP expired or not found" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return {
      verified: false,
      reason: "Too many OTP attempts. Request a new code.",
    };
  }
  const isMatch = await bcrypt.compare(String(code).trim(), record.codeHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    return { verified: false, reason: "Invalid OTP" };
  }
  if (consume) {
    record.consumedAt = new Date();
    await record.save();
  }
  return { verified: true, email: normalized };
};
