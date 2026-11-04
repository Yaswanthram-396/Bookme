import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLocation,
  isDateBookable,
  parseDays,
  parseServiceSettings,
  resolveWindows,
} from "./serviceSchedule.js";

const TODAY = "2026-11-05";
const base = { advanceDays: 14, bookableFrom: "", bookableUntil: "" };

test("isDateBookable: past dates are rejected, today is allowed", () => {
  assert.equal(isDateBookable(base, "2026-11-04", TODAY), false);
  assert.equal(isDateBookable(base, "2026-11-05", TODAY), true);
});

test("isDateBookable: advanceDays boundary", () => {
  const svc = { ...base, advanceDays: 7 };
  assert.equal(isDateBookable(svc, "2026-11-11", TODAY), true); // day 7 of 7
  assert.equal(isDateBookable(svc, "2026-11-12", TODAY), false);
});

test("isDateBookable: from/until window", () => {
  const svc = { ...base, bookableFrom: "2026-11-10", bookableUntil: "2026-11-12" };
  assert.equal(isDateBookable(svc, "2026-11-09", TODAY), false);
  assert.equal(isDateBookable(svc, "2026-11-10", TODAY), true);
  assert.equal(isDateBookable(svc, "2026-11-12", TODAY), true);
  assert.equal(isDateBookable(svc, "2026-11-13", TODAY), false);
});

test("isDateBookable: rejects malformed dates", () => {
  assert.equal(isDateBookable(base, "tomorrow", TODAY), false);
});

test("resolveWindows: falls back to default schedule when no override", () => {
  const def = { slot: [{ startTime: "09:00", endTime: "17:00" }] };
  assert.deepEqual(resolveWindows({ availability: [] }, def, 1), def.slot);
  assert.deepEqual(resolveWindows({}, undefined, 1), []);
});

test("resolveWindows: service override replaces defaults; unlisted days closed", () => {
  const def = { slot: [{ startTime: "09:00", endTime: "17:00" }] };
  const svc = {
    availability: [{ dayOfWeek: 1, slot: [{ startTime: "10:00", endTime: "12:00" }] }],
  };
  assert.deepEqual(resolveWindows(svc, def, 1), svc.availability[0].slot);
  assert.deepEqual(resolveWindows(svc, def, 2), []);
});

test("parseDays: accepts valid input and rejects bad input atomically", () => {
  const ok = parseDays([
    { dayOfWeek: 1, slots: [{ startTime: "09:00", endTime: "12:00" }] },
    { dayOfWeek: 2, slots: [] },
  ]);
  assert.equal(ok.days.length, 2);
  assert.ok(parseDays([{ dayOfWeek: 1, slots: [{ startTime: "12:00", endTime: "09:00" }] }]).error);
  assert.ok(parseDays([{ dayOfWeek: 1, slots: [] }, { dayOfWeek: 1, slots: [] }]).error);
  assert.ok(parseDays([{ dayOfWeek: 7, slots: [] }]).error);
  assert.ok(parseDays([{ dayOfWeek: 1, slots: [{ startTime: "9am", endTime: "5pm" }] }]).error);
  assert.ok(parseDays("nope").error);
});

test("parseServiceSettings: validation", () => {
  assert.ok(parseServiceSettings({ locationType: "mars" }).error);
  assert.ok(parseServiceSettings({ locationType: "online" }).error);
  assert.ok(parseServiceSettings({ advanceDays: 0 }).error);
  assert.ok(parseServiceSettings({ advanceDays: 400 }).error);
  assert.ok(parseServiceSettings({ bookableFrom: "2026-12-01", bookableUntil: "2026-11-01" }).error);
  const ok = parseServiceSettings({
    locationType: "online",
    locationDetails: " https://meet.example/x ",
    advanceDays: "30",
  });
  assert.equal(ok.updates.locationDetails, "https://meet.example/x");
  assert.equal(ok.updates.advanceDays, 30);
  assert.deepEqual(parseServiceSettings({}).updates, {});
});

test("formatLocation", () => {
  assert.equal(formatLocation({ locationType: "in_person", locationDetails: "12 Main St" }), "In person: 12 Main St");
  assert.equal(formatLocation({ locationType: "phone" }), "Phone");
  assert.equal(formatLocation({}), "");
});
