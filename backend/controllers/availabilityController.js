import Availability from "../models/Availability.js";
import { isValidTimeRange } from "../utils/time.js";
import { parseDays } from "../utils/serviceSchedule.js";

export const listAvailability = async (req, res) => {
  try {
    const availability = await Availability.find({ userId: req.user.id }).sort({
      dayOfWeek: 1,
    });
    res.status(200).json({ success: true, availability });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const saveAvailability = async (req, res) => {
  try {
    const { days, dayOfWeek, slots } = req.body;

    // Bulk save: validate every day first so nothing is partially saved.
    if (days !== undefined) {
      const parsed = parseDays(days);
      if (parsed.error) {
        return res.status(400).json({ success: false, message: parsed.error });
      }
      if (parsed.days.length) {
        await Availability.bulkWrite(
          parsed.days.map((day) => ({
            updateOne: {
              filter: { userId: req.user.id, dayOfWeek: day.dayOfWeek },
              update: { $set: { slot: day.slots } },
              upsert: true,
            },
          })),
        );
      }
      const availability = await Availability.find({
        userId: req.user.id,
      }).sort({ dayOfWeek: 1 });
      return res.status(200).json({ success: true, availability });
    }

    // Legacy single-day save.
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
