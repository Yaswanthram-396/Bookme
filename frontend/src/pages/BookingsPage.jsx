import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { listBookings, cancelBooking, rescheduleBooking } from "../api/bookings";
import { useToast } from "../context/Toastcontext";
import { Calendar, Clock, X, RefreshCcw } from "lucide-react";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const badgeClass = (status) => {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "bg-red-50 text-red-600";
  return "bg-slate-100 text-slate-600";
};

export default function BookingsPage() {
  const { showToast } = useToast() || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", startTime: "", endTime: "" });
  const [saving, setSaving] = useState(false);

  const load = async (status) => {
    setLoading(true);
    try {
      const { data } = await listBookings(status ? { status } : {});
      setBookings(data.bookings || []);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel booking for ${booking.customerName}?`)) return;
    try {
      await cancelBooking(booking._id);
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? { ...b, status: "cancelled" } : b)),
      );
      showToast?.("Booking cancelled", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to cancel booking", "error");
    }
  };

  const openReschedule = (booking) => {
    setRescheduleTarget(booking);
    setRescheduleForm({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await rescheduleBooking(rescheduleTarget._id, rescheduleForm);
      setBookings((prev) =>
        prev.map((b) => (b._id === rescheduleTarget._id ? data.booking : b)),
      );
      showToast?.("Booking rescheduled", "success");
      setRescheduleTarget(null);
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to reschedule", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Bookings</h1>
            <p className="mt-1 text-sm text-slate-500">
              View and manage appointments booked through your page.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-indigo-100 bg-indigo-50 p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === f.value
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
            <p className="text-sm text-slate-500">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-slate-800">{booking.customerName}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {booking.serviceId?.name || "Service"} &middot; {booking.customerEmail}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {booking.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {booking.startTime}-{booking.endTime}
                    </span>
                  </div>
                </div>

                {booking.status === "confirmed" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openReschedule(booking)}
                      className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" /> Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(booking)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {rescheduleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">Reschedule</h2>
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form className="space-y-3.5" onSubmit={submitReschedule}>
                <div>
                  <label className="text-[13px] font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                    value={rescheduleForm.date}
                    onChange={(e) =>
                      setRescheduleForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-bold text-slate-700">Start</label>
                    <input
                      type="time"
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                      value={rescheduleForm.startTime}
                      onChange={(e) =>
                        setRescheduleForm((f) => ({ ...f, startTime: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700">End</label>
                    <input
                      type="time"
                      className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                      value={rescheduleForm.endTime}
                      onChange={(e) =>
                        setRescheduleForm((f) => ({ ...f, endTime: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(99,102,241,0.25)] transition hover:opacity-95 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Confirm reschedule"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
