import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    bufferBefore: {
      type: Number,
      default: 0,
      min: 0,
    },
    bufferAfter: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      default: "default-icon.png",
    },
    availability: {
      type: [
        new mongoose.Schema(
          {
            dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
            slot: {
              type: [
                new mongoose.Schema(
                  {
                    startTime: { type: String, required: true },
                    endTime: { type: String, required: true },
                  },
                  { _id: false },
                ),
              ],
              default: [],
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    bookableFrom: {
      type: String,
      default: "",
    },
    bookableUntil: {
      type: String,
      default: "",
    },
    advanceDays: {
      type: Number,
      default: 14,
      min: 1,
      max: 365,
    },
    locationType: {
      type: String,
      enum: ["in_person", "online", "phone"],
      default: "in_person",
    },
    locationDetails: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
