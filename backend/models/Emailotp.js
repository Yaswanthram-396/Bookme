import mongoose from "mongoose";

const EmailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["register", "booking", "resetPassword"],
      required: true,
      codeHash: {
        type: String,
        required: true,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
      },
      consumedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true },
);

const EmailOtp = mongoose.model("EmailOtp", EmailOtpSchema);

export default EmailOtp;
