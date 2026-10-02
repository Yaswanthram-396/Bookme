import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  MapPin,
  IndianRupee,
  CreditCard,
  Smartphone,
  Landmark,
} from "lucide-react";
import {
  getPublicBusiness,
  getPublicSlots,
  requestPublicBookingOtp,
  verifyPublicBookingOtp,
  createPublicBooking,
} from "../api/public";

const STEPS = {
  SERVICE: "service",
  SLOT: "slot",
  DETAILS: "details",
  OTP: "otp",
  PAYMENT: "payment",
  DONE: "done",
};

const PAYMENT_METHODS = [
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "netbanking", label: "Netbanking", icon: Landmark },
];

const formatMoney = (amount = 0, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);

const buildNextDays = (count = 14) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    days.push({
      iso,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return days;
};

const inputClass =
  "w-full h-12 rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100";

export default function PublicBookingPage() {
  const { slug } = useParams();
  const days = useMemo(() => buildNextDays(), []);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);

  const [step, setStep] = useState(STEPS.SERVICE);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(days[0]?.iso || "");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const [paymentMode, setPaymentMode] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPublicBusiness(slug);
        setBusiness(data.business);
        setServices((data.services || []).filter((svc) => svc.isActive));
      } catch (err) {
        setLoadError(
          err.response?.data?.message || "This booking page could not be found.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  useEffect(() => {
    if (step !== STEPS.SLOT || !selectedService || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setError("");
    getPublicSlots(slug, { date: selectedDate, serviceId: selectedService._id })
      .then(({ data }) => setSlots(data.slots || []))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load available times"),
      )
      .finally(() => setSlotsLoading(false));
  }, [step, selectedService, selectedDate, slug]);

  const chooseService = (service) => {
    setSelectedService(service);
    setStep(STEPS.SLOT);
  };

  const chooseSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(STEPS.DETAILS);
  };

  const submitDetails = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Name and email are required");
      return;
    }
    setError("");
    setStep(STEPS.OTP);
  };

  const sendOtp = async () => {
    setSubmitting(true);
    setError("");
    setOtpNotice("");
    try {
      const { data } = await requestPublicBookingOtp(
        slug,
        customerEmail.trim().toLowerCase(),
      );
      setOtpSent(true);
      setOtpCooldown(30);
      if (data?.otpResponse?.emailDelivered === false) {
        setOtpNotice(
          "Email delivery isn't configured — ask the business for your code, or check the backend console.",
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setSubmitting(true);
    setError("");
    try {
      await verifyPublicBookingOtp(slug, {
        customerEmail: customerEmail.trim().toLowerCase(),
        emailOtp: otp,
      });
      setOtpVerified(true);
    } catch (err) {
      setOtpVerified(false);
      setError(err.response?.data?.message || "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  };

  const goToPaymentOrConfirm = () => {
    if (selectedService?.price > 0) {
      setError("");
      setStep(STEPS.PAYMENT);
      return;
    }
    confirmBooking();
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await createPublicBooking(slug, {
        serviceId: selectedService._id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes.trim(),
        emailOtp: otp,
        paymentMode: selectedService?.price > 0 ? paymentMode : undefined,
      });
      setConfirmedBooking(data.booking);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete booking");
      if (err.response?.status === 409) {
        setStep(STEPS.SLOT);
        setSelectedSlot(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.12),_transparent_28%),linear-gradient(135deg,_#f8faff_0%,_#eef4ff_100%)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {business.business || business.name}
          </h1>
          {business.businessDescription && (
            <p className="mt-2 text-sm text-slate-500">
              {business.businessDescription}
            </p>
          )}
          {business.timezone && (
            <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {business.timezone}
            </p>
          )}
        </header>

        <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.1)] backdrop-blur-md sm:p-8">
          {step === STEPS.SERVICE && (
            <div>
              <h2 className="mb-5 text-lg font-bold text-slate-800">
                Choose a service
              </h2>
              {services.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No services are available for booking right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <button
                      key={service._id}
                      type="button"
                      onClick={() => chooseService(service)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50/60"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{service.name}</p>
                        {service.description && (
                          <p className="mt-1 text-xs text-slate-500">
                            {service.description}
                          </p>
                        )}
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Clock className="h-3.5 w-3.5" /> {service.duration} min
                        </p>
                      </div>
                      <span className="flex items-center gap-0.5 text-base font-extrabold text-indigo-700">
                        <IndianRupee className="h-4 w-4" />
                        {service.price || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === STEPS.SLOT && selectedService && (
            <div>
              <button
                type="button"
                onClick={() => setStep(STEPS.SERVICE)}
                className="mb-4 flex items-center gap-1 text-sm font-bold text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="mb-1 text-lg font-bold text-slate-800">
                {selectedService.name}
              </h2>
              <p className="mb-5 text-sm text-slate-500">Pick a date and time</p>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedDate(d.iso)}
                    className={`flex min-w-[58px] flex-col items-center rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      selectedDate === d.iso
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      {d.label}
                    </span>
                    <span className="text-base">{d.day}</span>
                    <span className="text-[10px] opacity-80">{d.month}</span>
                  </button>
                ))}
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : slots.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No available times on this day.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => chooseSlot(slot)}
                      className="rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
              {error && (
                <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
              )}
            </div>
          )}

          {step === STEPS.DETAILS && (
            <div>
              <button
                type="button"
                onClick={() => setStep(STEPS.SLOT)}
                className="mb-4 flex items-center gap-1 text-sm font-bold text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="mb-1 text-lg font-bold text-slate-800">Your details</h2>
              <p className="mb-5 flex items-center gap-1 text-sm text-slate-500">
                <Calendar className="h-4 w-4" /> {selectedDate} &middot;{" "}
                {selectedSlot.startTime}-{selectedSlot.endTime}
              </p>

              <form className="space-y-4" onSubmit={submitDetails}>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">
                    Full name
                  </label>
                  <input
                    className={inputClass}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">
                    Email address
                  </label>
                  <input
                    className={inputClass}
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything the provider should know?"
                  />
                </div>
                {error && (
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  className="h-[52px] w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(99,102,241,0.25)] transition hover:opacity-95"
                >
                  Continue
                </button>
              </form>
            </div>
          )}

          {step === STEPS.OTP && (
            <div>
              <button
                type="button"
                onClick={() => setStep(STEPS.DETAILS)}
                className="mb-4 flex items-center gap-1 text-sm font-bold text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="mb-1 text-lg font-bold text-slate-800">
                Verify your email
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                We'll send a 6-digit code to {customerEmail}
              </p>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={submitting}
                  className="h-[52px] w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(99,102,241,0.25)] transition hover:opacity-95 disabled:opacity-70"
                >
                  {submitting ? "Sending..." : "Send verification code"}
                </button>
              ) : (
                <div className="space-y-4">
                  {otpNotice && (
                    <p className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-700">
                      {otpNotice}
                    </p>
                  )}
                  <div className="flex gap-2.5">
                    <input
                      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-center text-lg font-bold tracking-[0.3em] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setOtpVerified(false);
                      }}
                      maxLength={6}
                      placeholder="000000"
                    />
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={submitting || otpCooldown > 0}
                      className="min-w-[110px] rounded-xl bg-indigo-100 px-3 text-sm font-extrabold text-indigo-800 transition hover:bg-indigo-200 disabled:opacity-60"
                    >
                      {otpCooldown > 0 ? `Resend ${otpCooldown}s` : "Resend"}
                    </button>
                  </div>

                  {otpVerified ? (
                    <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Email verified
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={submitting || otp.length !== 6}
                      className="h-11 w-full rounded-xl bg-slate-900 text-sm font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {submitting ? "Verifying..." : "Verify code"}
                    </button>
                  )}

                  {error && (
                    <p className="text-sm font-semibold text-red-600">{error}</p>
                  )}

                  <button
                    type="button"
                    onClick={goToPaymentOrConfirm}
                    disabled={!otpVerified || submitting}
                    className="h-[52px] w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(99,102,241,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? "Confirming..."
                      : selectedService?.price > 0
                        ? "Continue to payment"
                        : "Confirm booking"}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === STEPS.PAYMENT && selectedService && (
            <div>
              <button
                type="button"
                onClick={() => setStep(STEPS.OTP)}
                className="mb-4 flex items-center gap-1 text-sm font-bold text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="mb-1 text-lg font-bold text-slate-800">Payment</h2>
              <p className="mb-5 text-sm text-slate-500">
                Amount due:{" "}
                <span className="font-extrabold text-slate-800">
                  {formatMoney(selectedService.price, "inr")}
                </span>
              </p>

              <div className="mb-5 grid grid-cols-3 gap-2.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMode(method.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition ${
                      paymentMode === method.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
                    }`}
                  >
                    <method.icon className="h-5 w-5" />
                    {method.label}
                  </button>
                ))}
              </div>

              {paymentMode === "card" && (
                <div className="space-y-3.5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">
                      Card number
                    </label>
                    <input
                      className={inputClass}
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 16)
                            .replace(/(\d{4})(?=\d)/g, "$1 "),
                        )
                      }
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">
                        Expiry
                      </label>
                      <input
                        className={inputClass}
                        value={cardExpiry}
                        onChange={(e) =>
                          setCardExpiry(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4)
                              .replace(/(\d{2})(?=\d)/, "$1/"),
                          )
                        }
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">
                        CVV
                      </label>
                      <input
                        className={inputClass}
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                        }
                        placeholder="123"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMode === "upi" && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">UPI ID</label>
                  <input
                    className={inputClass}
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="you@upi"
                  />
                </div>
              )}

              {paymentMode === "netbanking" && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  You'll be redirected to your bank to complete payment.
                </p>
              )}

              {error && (
                <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
              )}

              <button
                type="button"
                onClick={confirmBooking}
                disabled={submitting}
                className="mt-6 h-[52px] w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(99,102,241,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Processing payment..."
                  : `Pay ${formatMoney(selectedService.price, "inr")}`}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                This is a test/mock payment — no real money is charged.
              </p>
            </div>
          )}

          {step === STEPS.DONE && confirmedBooking && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
              <h2 className="mb-2 text-xl font-extrabold text-slate-900">
                Booking confirmed!
              </h2>
              <p className="mb-6 text-sm text-slate-500">
                A confirmation email has been sent to {confirmedBooking.customerEmail}
              </p>
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
                <p className="font-bold text-slate-800">{selectedService?.name}</p>
                <p className="mt-1 text-slate-500">
                  {confirmedBooking.date} &middot; {confirmedBooking.startTime}-
                  {confirmedBooking.endTime}
                </p>
                {selectedService?.price ? (
                  <p className="mt-1 text-slate-500">
                    {formatMoney(selectedService.price, confirmedBooking.currency)}
                  </p>
                ) : null}
              </div>
              {confirmedBooking.customerCalendarUrl && (
                <a
                  href={confirmedBooking.customerCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-extrabold text-white transition hover:opacity-90"
                >
                  Add to Google Calendar
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
