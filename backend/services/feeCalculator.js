import { getPlatformSettings } from "../models/PlatformSettings.js";

export const calculateFeeSplit = async (grossAmount) => {
  const settings = await getPlatformSettings();
  const platformFee = Math.round(
    (grossAmount * settings.platformFeePercent) / 100,
  );
  const providerAmount = grossAmount - platformFee;
  return {
    grossAmount,
    platformFee,
    providerAmount,
    platformFeePercent: settings.platformFeePercent,
  };
};
