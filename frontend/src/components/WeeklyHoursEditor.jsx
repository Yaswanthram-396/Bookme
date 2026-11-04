import { Plus, Trash2 } from "lucide-react";
import { DAYS } from "./schedule";

// Controlled editor for a week of working hours. Saving is up to the parent.
export default function WeeklyHoursEditor({ value, onChange, compact = false }) {
  const updateDay = (dayValue, updater) =>
    onChange({ ...value, [dayValue]: updater(value[dayValue]) });

  const toggleDay = (dayValue) =>
    updateDay(dayValue, (day) => ({
      ...day,
      enabled: !day.enabled,
      slots:
        !day.enabled && day.slots.length === 0
          ? [{ startTime: "09:00", endTime: "17:00" }]
          : day.slots,
    }));

  const addSlot = (dayValue) =>
    updateDay(dayValue, (day) => ({
      ...day,
      slots: [...day.slots, { startTime: "09:00", endTime: "17:00" }],
    }));

  const removeSlot = (dayValue, index) =>
    updateDay(dayValue, (day) => ({
      ...day,
      slots: day.slots.filter((_, i) => i !== index),
    }));

  const updateSlot = (dayValue, index, field, fieldValue) =>
    updateDay(dayValue, (day) => ({
      ...day,
      slots: day.slots.map((slot, i) =>
        i === index ? { ...slot, [field]: fieldValue } : slot,
      ),
    }));

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {DAYS.map((day) => {
        const state = value[day.value];
        return (
          <div
            key={day.value}
            className={compact ? "rounded-xl border border-slate-200 p-3" : "premium-card p-5"}
          >
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.enabled}
                onChange={() => toggleDay(day.value)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-bold text-slate-800">{day.label}</span>
            </label>

            {state.enabled && (
              <div className={`space-y-2.5 pl-7 ${compact ? "mt-3" : "mt-4"}`}>
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
  );
}
