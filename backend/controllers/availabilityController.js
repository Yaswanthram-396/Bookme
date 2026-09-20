import Availability from "../models/availibility.js";
import { isValidTimeRange } from "../utils/time.js";

export const listAvailability = async (req, res) => {
  try {
    const availability = (
      await Availability.find({ userId: req.user.id })
    ).toSorted({ dayOfWeek: 1 });
    res.status(200).json({ success: true, availability });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const saveAvailability = async (req, res) => {
  try {
    const { dayOfWeek, slots } = req.body;
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dayOfWeek" });
    }
    const cleanedSlots = (slots || []).filter(
      (slot) =>
        slot.startTime &&
        slot.endTime &&
        isValidTimeRange(slot.startTime, slot.endTime),
    );
    const availability = await Availability.findOneAndUpdate(
      { userId: req.user.id, dayOfWeek },
      { slot: cleanedSlots },
      { new: true, upsert: true },
    );
    res.status(200).json({ success: true, availability });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
