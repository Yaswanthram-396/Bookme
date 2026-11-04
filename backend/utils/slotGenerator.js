import Availability from "../models/Availability.js";
import { timeOverlap } from "./overlap.js";
import Booking from "../models/Booking.js";
import { getDayOfWeek, timeToMinutes, minutesToTime } from "./time.js";
import {
  isDateBookable,
  resolveWindows,
  toLocalISODate,
} from "./serviceSchedule.js";

export const generateSlots = async (userId, service, date) => {
  const dayOfWeek = getDayOfWeek(date);
  try {
    if (!isDateBookable(service, date)) return [];

    const availability = service.availability?.length
      ? null
      : await Availability.findOne({ userId, dayOfWeek });
    const windows = resolveWindows(service, availability, dayOfWeek);
    if (!windows.length) return [];

    const bookings = await Booking.find({
      userId,
      date,
      active: true,
    });

    const duration = service.duration;
    const bufferBefore = service.bufferBefore || 0;
    const bufferAfter = service.bufferAfter || 0;
    const step = duration + bufferBefore + bufferAfter;

    const now = new Date();
    const isToday = date === toLocalISODate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (const window of windows) {
      const windowStart = timeToMinutes(window.startTime);
      const windowEnd = timeToMinutes(window.endTime);

      for (
        let slotStart = windowStart;
        slotStart + duration <= windowEnd;
        slotStart += step
      ) {
        const bufferedStart = slotStart - bufferBefore;
        const bufferedEnd = slotStart + duration + bufferAfter;
        if (bufferedStart < windowStart || bufferedEnd > windowEnd) continue;

        const slotEnd = slotStart + duration;
        if (isToday && slotStart <= nowMinutes) continue;

        const startTime = minutesToTime(slotStart);
        const endTime = minutesToTime(slotEnd);

        const hasConflict = bookings.some((booking) =>
          timeOverlap(
            minutesToTime(bufferedStart),
            minutesToTime(bufferedEnd),
            booking.startTime,
            booking.endTime,
          ),
        );

        if (!hasConflict) {
          slots.push({ startTime, endTime });
        }
      }
    }

    return slots;
  } catch (error) {
    console.log(error);
    throw new Error("Error generating slots");
  }
};
