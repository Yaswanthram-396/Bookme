import Availability from "../models/availibility.js";
import { timeOverlap } from "./overlap.js";
import Booking from "../models/Booking.js";
import { getDayOfWeek } from "./time.js";

const formatTime = (value) => {
  if (value instanceof Date) {
    return `${value.getUTCHours().toString().padStart(2, "0")}:${value
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  return String(value).slice(0, 5);
};

export const generateSlots = async (userId, service, date) => {
  const dayOfWeek = getDayOfWeek(date);
  try {
    const availability = await Availability.findOne({ userId, dayOfWeek });
    if (!availability || !availability.slot.length) {
      return [];
    }
    const bookings = await Booking.find({
      userId,
      date,
      status: "confirmed",
    });
    const slots = availability.slot
      .map((slot) => ({
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
      }))
      .filter((slot) => {
        return !bookings.some((booking) =>
          timeOverlap(
            slot.startTime,
            slot.endTime,
            booking.startTime,
            booking.endTime,
          ),
        );
      });
    return slots;
  } catch (error) {
    console.log(error);
    throw new Error("Error generating slots");
  }
};
