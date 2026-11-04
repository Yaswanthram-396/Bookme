import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import WeeklyHoursEditor from "../components/WeeklyHoursEditor";
import {
  daysToSchedule,
  emptySchedule,
  hasInvalidSlot,
  scheduleToDays,
} from "../components/schedule";
import { listAvailability, saveAvailability } from "../api/avilibility";
import { useToast } from "../context/Toastcontext";

export default function AvailabilityPage() {
  const { showToast } = useToast() || {};
  const [schedule, setSchedule] = useState(emptySchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listAvailability();
        setSchedule(daysToSchedule(data.availability));
      } catch (err) {
        showToast?.(err.response?.data?.message || "Failed to load availability", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (hasInvalidSlot(schedule)) {
      showToast?.("Start time must be before end time", "error");
      return;
    }
    setSaving(true);
    try {
      const { data } = await saveAvailability({ days: scheduleToDays(schedule) });
      setSchedule(daysToSchedule(data.availability));
      showToast?.("Availability saved", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to save availability", "error");
    } finally {
      setSaving(false);
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Availability</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your default weekly working hours. Services without their own custom hours use
              these. Customers only see slots inside these windows.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="premium-btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save availability"}
          </button>
        </div>

        <WeeklyHoursEditor value={schedule} onChange={setSchedule} />
      </div>
    </AppLayout>
  );
}
