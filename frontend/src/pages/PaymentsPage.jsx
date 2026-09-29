import AppLayout from "../components/AppLayout";
import { Wallet } from "lucide-react";

export default function PaymentsPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Payouts, revenue breakdowns and Stripe checkout are coming soon.
        </p>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <Wallet className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">
            Payment processing isn't set up yet. Bookings are currently free to
            confirm.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
