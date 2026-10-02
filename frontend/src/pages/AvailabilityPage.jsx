import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { listAvailability, saveAvailability } from "../api/avilibility";
import { useToast } from "../context/Toastcontext";
import { Plus, Trash2 } from "lucide-react";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const emptySchedule = () =>
  DAYS.reduce((acc, day) => {
    acc[day.value] = { enabled: false, slots: [] };
    return acc;
  }, {});

export default function AvailabilityPage() {
  const { showToast } = useToast() || {};
  const [schedule, setSchedule] = useState(emptySchedule());
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listAvailability();
        const next = emptySchedule();
        (data.availability || []).forEach((entry) => {
          next[entry.dayOfWeek] = {
            enabled: (entry.slot || []).length > 0,
            slots: (entry.slot || []).map((s) => ({
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          };
        });
        setSchedule(next);
      } catch (err) {
        showToast?.(err.response?.data?.message || "Failed to load availability", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateDay = (dayValue, updater) => {
    setSchedule((prev) => ({
      ...prev,
      [dayValue]: updater(prev[dayValue]),
    }));
  };

  const toggleDay = (dayValue) => {
    updateDay(dayValue, (day) => ({
      ...day,
      enabled: !day.enabled,
      slots: !day.enabled && day.slots.length === 0
        ? [{ startTime: "09:00", endTime: "17:00" }]
        : day.slots,
    }));
  };

  const addSlot = (dayValue) => {
    updateDay(dayValue, (day) => ({
      ...day,
      slots: [...day.slots, { startTime: "09:00", endTime: "17:00" }],
    }));
  };

  const removeSlot = (dayValue, index) => {
    updateDay(dayValue, (day) => ({
      ...day,
      slots: day.slots.filter((_, i) => i !== index),
    }));
  };

  const updateSlot = (dayValue, index, field, value) => {
    updateDay(dayValue, (day) => ({
      ...day,
      slots: day.slots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }));
  };

  const saveDay = async (dayValue) => {
    const day = schedule[dayValue];
    const slotsToSave = day.enabled ? day.slots : [];
    const invalid = slotsToSave.some((s) => s.startTime >= s.endTime);
    if (invalid) {
      showToast?.("Start time must be before end time", "error");
      return;
    }
    setSavingDay(dayValue);
    try {
      await saveAvailability({ dayOfWeek: dayValue, slots: slotsToSave });
      showToast?.("Availability saved", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to save availability", "error");
    } finally {
      setSavingDay(null);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-slate-500">Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold text-slate-900">Availability</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Set your weekly working hours. Customers will only see slots inside these windows.
        </p>

        <div className="space-y-3">
          {DAYS.map((day) => {
            const state = schedule[day.value];
            return (
              <div
                key={day.value}
                className="premium-card p-5"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={() => toggleDay(day.value)}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-slate-800">{day.label}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => saveDay(day.value)}
                    disabled={savingDay === day.value}
                    className="premium-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                  >
                    {savingDay === day.value ? "Saving..." : "Save"}
                  </button>
                </div>

                {state.enabled && (
                  <div className="mt-4 space-y-2.5 pl-7">
                    {state.slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateSlot(day.value, index, "startTime", e.target.value)
                          }
                          className="premium-input h-10 px-3 text-sm w-32"
                        />
                        <span className="text-sm text-slate-400">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateSlot(day.value, index, "endTime", e.target.value)
                          }
                          className="premium-input h-10 px-3 text-sm w-32"
                        />
                        <button
                          type="button"
                          onClick={() => removeSlot(day.value, index)}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          aria-label="Remove interval"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSlot(day.value)}
                      className="flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add interval
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
