import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { getRevenue } from "../api/payment";
import { getme, updateProfile } from "../api/auth";
import { useToast } from "../context/Toastcontext";
import { Wallet, TrendingUp, Percent, Undo2, Banknote } from "lucide-react";

const formatMoney = (amount = 0, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

const inputClass =
  "premium-input w-full";

const emptyPayout = {
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  bankBranch: "",
  upiId: "",
};

export default function PaymentsPage() {
  const { showToast } = useToast() || {};
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payoutDetails, setPayoutDetails] = useState(emptyPayout);
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: revenueData }, { data: meData }] = await Promise.all([
          getRevenue(),
          getme(),
        ]);
        setSummary(revenueData.summary);
        setPayments(revenueData.payments || []);
        const existing = meData.data?.payoutDetails || {};
        setPayoutDetails({
          accountHolderName: existing.accountHolderName || "",
          accountNumber: existing.accountNumber || "",
          ifscCode: existing.ifscCode || "",
          bankName: existing.bankName || "",
          bankBranch: existing.bankBranch || "",
          upiId: existing.upiId || "",
        });
      } catch (err) {
        showToast?.(err.response?.data?.message || "Failed to load payments", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const savePayoutDetails = async (e) => {
    e.preventDefault();
    setSavingPayout(true);
    try {
      await updateProfile({ payoutDetails });
      showToast?.("Payout details saved", "success");
    } catch (err) {
      showToast?.(err.response?.data?.message || "Failed to save payout details", "error");
    } finally {
      setSavingPayout(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-slate-500">Loading...</p>
      </AppLayout>
    );
  }

  const cards = [
    { label: "Gross revenue", value: summary.grossRevenue, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50" },
    { label: "Platform fees", value: summary.platformFees, icon: Percent, color: "text-orange-600 bg-orange-50" },
    { label: "Your revenue", value: summary.providerRevenue, icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
    { label: "Refunds", value: summary.refunds, icon: Undo2, color: "text-red-600 bg-red-50" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Revenue from paid bookings and where to send your payouts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="premium-card p-4"
            >
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {card.label}
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-slate-800">
                {formatMoney(card.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Net revenue</h2>
            <p className="text-xl font-extrabold text-emerald-700">
              {formatMoney(summary.netRevenue)}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Payouts aren't automated yet — use the bank/UPI details below so
            payouts can be sent manually.
          </p>
        </div>

        <div className="premium-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Payout details</h2>
          </div>
          <form className="space-y-3.5" onSubmit={savePayoutDetails}>
            <div>
              <label className="text-[13px] font-bold text-slate-700">
                Account holder name
              </label>
              <input
                className={inputClass}
                value={payoutDetails.accountHolderName}
                onChange={(e) =>
                  setPayoutDetails((p) => ({ ...p, accountHolderName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-slate-700">Account number</label>
                <input
                  className={inputClass}
                  value={payoutDetails.accountNumber}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, accountNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-slate-700">IFSC code</label>
                <input
                  className={inputClass}
                  value={payoutDetails.ifscCode}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, ifscCode: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-slate-700">Bank name</label>
                <input
                  className={inputClass}
                  value={payoutDetails.bankName}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, bankName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-slate-700">Branch</label>
                <input
                  className={inputClass}
                  value={payoutDetails.bankBranch}
                  onChange={(e) =>
                    setPayoutDetails((p) => ({ ...p, bankBranch: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-700">
                UPI ID (optional alternative)
              </label>
              <input
                className={inputClass}
                value={payoutDetails.upiId}
                onChange={(e) =>
                  setPayoutDetails((p) => ({ ...p, upiId: e.target.value }))
                }
                placeholder="you@upi"
              />
            </div>
            <button
              type="submit"
              disabled={savingPayout}
              className="premium-btn-primary w-full mt-2 disabled:opacity-70"
            >
              {savingPayout ? "Saving..." : "Save payout details"}
            </button>
          </form>
        </div>

        {payments.length > 0 && (
          <div className="premium-card p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Recent payments</h2>
            <div className="space-y-2.5">
              {payments.slice(0, 10).map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3.5 py-2.5 text-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {formatMoney(payment.amount, payment.currency)}
                  </span>
                  <span className="text-xs text-slate-400">{payment.customerEmail}</span>
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    {payment.paymentMode}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      payment.status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : payment.status === "refunded"
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
