import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const [params] = useSearchParams();
  const slug = params.get("slug");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <XCircle className="mx-auto mb-4 h-14 w-14 text-amber-500" />
        <h1 className="text-xl font-extrabold text-slate-900">Payment cancelled</h1>
        <p className="mt-2 text-sm text-slate-500">
          You have not been charged. Your time slot is held for a short while, so
          you can go back and try again.
        </p>
        {slug && (
          <Link
            to={`/book/${encodeURIComponent(slug)}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-extrabold text-white transition hover:opacity-95"
          >
            Try again
          </Link>
        )}
      </div>
    </div>
  );
}
