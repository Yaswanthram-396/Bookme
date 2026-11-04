import { isValidTimeRange } from "./time.js";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const LOCATION_TYPES = ["in_person", "online", "phone"];
export const MAX_ADVANCE_DAYS = 365;

const LOCATION_LABELS = {
  in_person: "In person",
  online: "Online",
  phone: "Phone",
};

export const toLocalISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const dayDiff = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** Human readable location, e.g. "Online: https://meet.example/abc". */
export const formatLocation = (service) => {
  const label = LOCATION_LABELS[service?.locationType];
  if (!label) return "";
  const details = (service.locationDetails || "").trim();
  return details ? `${label}: ${details}` : label;
};

/**
 * Whether customers may book `date` for this service, ignoring weekly hours:
 * not in the past, inside bookableFrom..bookableUntil, within advanceDays.
 */
export const isDateBookable = (service, date, today = toLocalISODate()) => {
  if (!DATE_RE.test(date)) return false;
  const offset = dayDiff(today, date);
  if (offset < 0) return false;
  if (offset >= (service.advanceDays || 14)) return false;
  if (service.bookableFrom && date < service.bookableFrom) return false;
  if (service.bookableUntil && date > service.bookableUntil) return false;
  return true;
};

/**
 * Working windows for a day. A service with its own weekly hours overrides the
 * provider's default schedule entirely (days it doesn't list are closed).
 * `defaultEntry` is the provider's Availability document for that day.
 */
export const resolveWindows = (service, defaultEntry, dayOfWeek) => {
  if (service.availability?.length) {
    const own = service.availability.find((d) => d.dayOfWeek === dayOfWeek);
    return own?.slot || [];
  }
  return defaultEntry?.slot || [];
};

/**
 * Strictly validate a list of `{ dayOfWeek, slots }`. Returns `{ error }` or
 * `{ days }`; nothing is partially accepted.
 */
export const parseDays = (days) => {
  if (!Array.isArray(days) || days.length > 7) {
    return { error: "Availability must be a list of at most 7 days" };
  }
  const seen = new Set();
  const parsed = [];
  for (const day of days) {
    const dayOfWeek = day?.dayOfWeek;
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return { error: "Invalid dayOfWeek" };
    }
    if (seen.has(dayOfWeek)) return { error: "Duplicate day in availability" };
    seen.add(dayOfWeek);

    const slots = Array.isArray(day.slots) ? day.slots : [];
    for (const slot of slots) {
      if (
        !TIME_RE.test(slot?.startTime || "") ||
        !TIME_RE.test(slot?.endTime || "") ||
        !isValidTimeRange(slot.startTime, slot.endTime)
      ) {
        return { error: "Start time must be before end time" };
      }
    }
    parsed.push({
      dayOfWeek,
      slots: slots.map(({ startTime, endTime }) => ({ startTime, endTime })),
    });
  }
  return { days: parsed };
};

/**
 * Validate the per-service settings present in `body`. Only fields that are
 * present are returned, so it works for both create and partial update.
 */
export const parseServiceSettings = (body = {}) => {
  const updates = {};

  if (body.locationType !== undefined) {
    if (!LOCATION_TYPES.includes(body.locationType)) {
      return { error: "Invalid location type" };
    }
    updates.locationType = body.locationType;
  }
  if (body.locationDetails !== undefined) {
    if (typeof body.locationDetails !== "string") {
      return { error: "Invalid location details" };
    }
    updates.locationDetails = body.locationDetails.trim().slice(0, 300);
  }
  if (body.locationType === "online" && !updates.locationDetails) {
    return { error: "A meeting link is required for online services" };
  }

  for (const field of ["bookableFrom", "bookableUntil"]) {
    if (body[field] !== undefined) {
      if (body[field] !== "" && !DATE_RE.test(body[field])) {
        return { error: `Invalid ${field}` };
      }
      updates[field] = body[field];
    }
  }
  if (
    updates.bookableFrom &&
    updates.bookableUntil &&
    updates.bookableFrom > updates.bookableUntil
  ) {
    return { error: "Bookable-from date must be on or before the until date" };
  }

  if (body.advanceDays !== undefined) {
    const n = Number(body.advanceDays);
    if (!Number.isInteger(n) || n < 1 || n > MAX_ADVANCE_DAYS) {
      return {
        error: `Advance booking days must be between 1 and ${MAX_ADVANCE_DAYS}`,
      };
    }
    updates.advanceDays = n;
  }

  if (body.availability !== undefined) {
    const result = parseDays(body.availability);
    if (result.error) return { error: result.error };
    updates.availability = result.days.map(({ dayOfWeek, slots }) => ({
      dayOfWeek,
      slot: slots,
    }));
  }

  return { updates };
};
