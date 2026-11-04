import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getPaymentStatus } from "../api/payment";

const POLL_MS = 2000;
const MAX_POLLS = 15;

const formatMoney = (minor = 0, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

// The redirect only carries a session id. Whether the payment succeeded is
// read from the backend, which is updated by Stripe's signed webhook.
export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return undefined;
    let cancelled = false;
    let timer;
    let polls = 0;

    const check = async () => {
      try {
        const { data } = await getPaymentStatus(sessionId);
        if (cancelled) return;
        setResult(data);
        const status = data.payment.status;
        if (status === "pending" && ++polls < MAX_POLLS) {
          timer = setTimeout(check, POLL_MS);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not verify payment");
        }
      }
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  const status = result?.payment?.status;
  const booking = result?.booking;
  const failed = status === "failed" || status === "expired";
  const missing = !sessionId || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        {missing ? (
          <>
            <XCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Payment not found
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {error || "No payment session was provided."}
            </p>
          </>
        ) : !result || status === "pending" ? (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Confirming your payment...
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {result
                ? "This is taking longer than usual. Check your email for a confirmation shortly."
                : "Please wait a moment."}
            </p>
          </>
        ) : failed ? (
          <>
            <XCircle className="mx-auto mb-4 h-14 w-14 text-red-500" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Payment was not completed
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              No booking was made. You have not been charged.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Payment successful
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your booking is confirmed. A confirmation was sent to{" "}
              {booking?.customerEmail}.
            </p>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
              <p className="font-bold text-slate-800">{booking?.service}</p>
              <p className="mt-1 text-slate-500">
                {booking?.date} &middot; {booking?.startTime}-{booking?.endTime}
              </p>
              {booking?.location && (
                <p className="mt-1 text-slate-500">{booking.location}</p>
              )}
              <p className="mt-1 text-slate-500">
                Paid {formatMoney(result.payment.amount, result.payment.currency)}
              </p>
              <p className="mt-2 break-all text-xs text-slate-400">
                Booking ID: {booking?.id}
              </p>
            </div>
            {booking?.customerCalendarUrl && (
              <a
                href={booking.customerCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                Add to Google Calendar
              </a>
            )}
          </>
        )}
        {(missing || failed) && (
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-bold text-indigo-600"
          >
            Back to home
          </Link>
        )}
      </div>
    </div>
  );
}
