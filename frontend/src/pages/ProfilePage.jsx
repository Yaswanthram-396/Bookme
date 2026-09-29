import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getme, updateProfile } from "../api/auth";
import {
  getGoogleConnectUrl,
  getGoogleConnectionStatus,
  disconnectGoogleCalendar,
} from "../api/integration";
import { useToast } from "../context/Toastcontext";
import { CalendarDays, CheckCircle2, Link2Off } from "lucide-react";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const inputClass =
  "w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100";

export default function ProfilePage() {
  const { showToast } = useToast() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    businessDescription: "",
    timezone: "Asia/Kolkata",
    brandAccent: "#7D57F5",
  });
  const [slug, setSlug] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: meData }, { data: statusData }] = await Promise.all([
          getme(),
          getGoogleConnectionStatus().catch(() => ({ data: { connected: false } })),
        ]);
        const user = meData.data;
        setForm({
          name: user.name || "",
          businessName: user.businessName || "",
          businessDescription: user.businessDescription || "",
          timezone: user.timezone || "Asia/Kolkata",
          brandAccent: user.brandAccent || "#7D57F5",
        });
        setSlug(user.slug || "");
        setCalendarConnected(statusData.connected || false);
      } catch (err) {
        showToast?.(err.response?.data?.message || "Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const calenderStatus = searchParams.get("calender");
    if (calenderStatus === "connected") {
      setCalendarConnected(true);
      showToast?.("Google Calendar connected", "success");
      setSearchParams({}, { replace: true });
    } else if (calenderStatus === "failed") {
      showToast?.("Google Calendar connection failed", "error");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateProfile(form);
      setSlug(data.data.slug || slug);
      showToast?.("Profile updated", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const connectCalendar = async () => {
    setCalendarLoading(true);
    try {
      const { data } = await getGoogleConnectUrl();
      window.location.href = data.url;
    } catch (err) {
      showToast?.(
        err.response?.data?.message || "Google Calendar is not configured",
        "error",
      );
      setCalendarLoading(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!window.confirm("Disconnect Google Calendar?")) return;
    setCalendarLoading(true);
    try {
      await disconnectGoogleCalendar();
      setCalendarConnected(false);
      showToast?.("Google Calendar disconnected", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to disconnect", "error");
    } finally {
      setCalendarLoading(false);
    }
  };

  const publicLink = slug ? `${window.location.origin}/book/${slug}` : "";

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-slate-500">Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Profile & settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update your business details and public booking page.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-[13px] font-bold text-slate-700">Your name</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-700">Business name</label>
              <input
                className={inputClass}
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              />
              {publicLink && (
                <p className="mt-1.5 text-xs text-slate-400">
                  Public page: <span className="font-semibold text-indigo-600">{publicLink}</span>
                </p>
              )}
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-700">Business description</label>
              <textarea
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                rows={3}
                value={form.businessDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessDescription: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-slate-700">Timezone</label>
                <select
                  className={inputClass}
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-bold text-slate-700">Brand accent</label>
                <input
                  type="color"
                  className="h-11 w-full rounded-xl border border-slate-300 px-1.5"
                  value={form.brandAccent}
                  onChange={(e) => setForm((f) => ({ ...f, brandAccent: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(99,102,241,0.25)] transition hover:opacity-95 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Google Calendar</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {calendarConnected ? "Connected" : "Not connected"}
                </p>
                {calendarConnected && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Bookings sync automatically
                  </p>
                )}
              </div>
            </div>
            {calendarConnected ? (
              <button
                type="button"
                onClick={disconnectCalendar}
                disabled={calendarLoading}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                <Link2Off className="h-3.5 w-3.5" /> Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={connectCalendar}
                disabled={calendarLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {calendarLoading ? "Redirecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
