import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: "singleton",
      unique: true,
    },
    platformFeePercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true },
);

const PlatformSettings = mongoose.model(
  "PlatformSettings",
  platformSettingsSchema,
);

export const getPlatformSettings = async () => {
  let settings = await PlatformSettings.findOne({ singleton: "singleton" });
  if (!settings) {
    settings = await PlatformSettings.create({ singleton: "singleton" });
  }
  return settings;
};

export default PlatformSettings;
