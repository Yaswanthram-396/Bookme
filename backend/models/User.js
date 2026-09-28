import mongoose from "mongoose";
const UsersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    businessName: {
      type: String,
      default: "",
      trim: true,
    },
    businessDescription: {
      type: String,
      default: "",
      trim: true,
    },
    brandTheme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    brandAccent: {
      type: String,
      default: "#7D57F5",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    googleRefreshToken: {
      type: String,
      default: "",
    },
    googleCalendarConnected: {
      type: Boolean,
      default: false,
    },
    googleCalendarId: {
      type: String,
      default: "",
    },
    payoutDetails: {
      accountHolderName: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String,
        default: "",
      },
      ifscCode: {
        type: String,
        default: "",
      },
      bankName: {
        type: String,
        default: "",
      },
      bankBranch: {
        type: String,
        default: "",
      },
      bankAddress: {
        type: String,
        default: "",
      },
      upiId: {
        type: String,
        default: "",
      },
      isComplete: {
        type: Boolean,
        default: false,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
  },

  { timestamps: true },
);

const Users = mongoose.model("User", UsersSchema);

export default Users;
