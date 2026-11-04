export const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export const emptySchedule = () =>
  DAYS.reduce((acc, day) => {
    acc[day.value] = { enabled: false, slots: [] };
    return acc;
  }, {});

// API entries look like [{ dayOfWeek, slot: [{ startTime, endTime }] }].
export const daysToSchedule = (entries = []) => {
  const schedule = emptySchedule();
  entries.forEach((entry) => {
    const slots = (entry.slot || []).map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
    }));
    schedule[entry.dayOfWeek] = { enabled: slots.length > 0, slots };
  });
  return schedule;
};

// Every day is sent, so a day switched off is saved as closed.
export const scheduleToDays = (schedule) =>
  DAYS.map((day) => ({
    dayOfWeek: day.value,
    slots: schedule[day.value].enabled ? schedule[day.value].slots : [],
  }));

export const hasInvalidSlot = (schedule) =>
  scheduleToDays(schedule).some((day) =>
    day.slots.some((s) => !s.startTime || !s.endTime || s.startTime >= s.endTime),
  );

export const defaultOpenSchedule = () => {
  const schedule = emptySchedule();
  [1, 2, 3, 4, 5].forEach((d) => {
    schedule[d] = { enabled: true, slots: [{ startTime: "09:00", endTime: "17:00" }] };
  });
  return schedule;
};
