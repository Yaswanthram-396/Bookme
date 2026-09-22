import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
import {
  login,
  getme,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  register,
} from "../api/auth";
import logo from "../../assets/logo.png";

const initialFormState = {
  email: "",
  password: "",
  otp: "",
  name: "",
  businessName: "",
};

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const isRegisterMode = mode === "register";
  const fromLocation = location.state?.from || "/dashboard";
  const redirectTo = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ""}`
    : "/profile";

  useEffect(() => {
    if (otpCooldown <= 0) return;

    const interval = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpCooldown]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === "emailOtp") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
      setForm((prev) => ({ ...prev, [name]: value }));
      if (otpVerified) setOtpVerified(false);
      if (digitsOnly.length === 6 && form.email) {
        try {
          await verifyRegistrationOtp({
            email: form.email,
            emailOtp: digitsOnly,
          });
          setOtpVerified(true);
          setMessage("Email verified successfully");
        } catch (err) {
          setOtpVerified(false);
          setMessage(err.response?.data?.message || "Failed to verify email");
        }
      }
      return;
    }
    if (name === "email") {
      setOtpVerified(false);
      setOtpSentTo("");
      setForm((prev) => ({ ...prev, email: value, emailOtp: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const sendOtp = async () => {
    if (!form.email) {
      setMessage("Please enter your email");
      return;
    }
    setOtpLoading(true);
    setMessage("");
    try {
      await requestRegistrationOtp(form.email);
      setOtpSentTo(form.email.trim().toLowerCase());
      setOtpVerified(false);
      setOtpCooldown(30);
      setMessage(`OTP sent to ${form.email}. Please check your email.`);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = isRegisterMode
        ? form
        : { email: form.email, password: form.password };
      const { data } = await (isRegisterMode
        ? register(payload)
        : login(payload));
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  const inputClass =
    "w-full h-12 rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100";
  const pillClass =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.18),_transparent_28%),linear-gradient(135deg,_#f8faff_0%,_#eef4ff_100%)] px-5 py-8 sm:px-6 lg:px-8">
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}

      <div className="mx-auto grid min-h-[720px] w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-md lg:grid-cols-[1.05fr_1fr]">
        <aside className="flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-8 text-slate-50 sm:p-10 lg:p-11">
          <div>
            <div className="mb-8 flex items-center gap-3.5">
              <img
                src={logo}
                alt="BookMe logo"
                className="h-12 w-12 rounded-[14px] bg-white p-1.5 object-cover"
              />
              <span className="text-[22px] font-extrabold tracking-[-0.03em]">
                BookMe
              </span>
            </div>

            <h1 className="max-w-[420px] text-4xl font-extrabold leading-[1.08] tracking-[-0.05em] text-white sm:text-5xl">
              Manage bookings without the chaos.
            </h1>

            <p className="mt-5 max-w-[460px] text-base leading-7 text-slate-300">
              Run your services, track your calendar, and deliver a smoother
              client experience from one simple dashboard.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                Active bookings
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                1,248
              </div>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-white/90 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="text-[28px] font-extrabold tracking-[-0.04em] text-slate-900">
                {isRegisterMode ? "Create account" : "Welcome back"}
              </div>

              <div className="inline-flex rounded-xl border border-indigo-100 bg-indigo-50 p-1">
                <button
                  type="button"
                  className={`${pillClass} ${
                    mode === "login"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.26)]"
                      : "text-slate-600"
                  }`}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`${pillClass} ${
                    mode === "register"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.26)]"
                      : "text-slate-600"
                  }`}
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegisterMode && (
                <>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">
                      Full name
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">
                      Business name
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      placeholder="Jane's Studio"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-700">
                  Email address
                </label>
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>

              {isRegisterMode && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">
                    Email OTP
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                      type="text"
                      name="otp"
                      value={form.otp || ""}
                      onChange={handleChange}
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      className="min-w-[120px] rounded-xl bg-indigo-100 px-4 py-3 text-sm font-extrabold text-indigo-800 transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={sendOtp}
                      disabled={otpLoading || otpCooldown > 0}
                    >
                      {otpLoading
                        ? "Sending..."
                        : otpCooldown > 0
                          ? `Resend in ${otpCooldown}s`
                          : "Send OTP"}
                    </button>
                  </div>

                  <div className="-mt-1 text-xs text-slate-600">
                    {otpSentTo ? (
                      <span>
                        Code sent to <strong>{otpSentTo}</strong>
                      </span>
                    ) : (
                      <span>We’ll send a verification code to your email.</span>
                    )}
                    {otpVerified && (
                      <span className="ml-2 font-bold text-emerald-600">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isRegisterMode ? (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">
                    Password
                  </label>
                  <input
                    className={inputClass}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700">
                    Password
                  </label>
                  <input
                    className={inputClass}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {!isRegisterMode && (
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-[54px] w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-extrabold text-white shadow-[0_16px_32px_rgba(99,102,241,0.25)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {loading
                  ? "Please wait..."
                  : isRegisterMode
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {isRegisterMode
                ? "Already have an account? "
                : "Need an account? "}
              <button
                type="button"
                onClick={() => setMode(isRegisterMode ? "login" : "register")}
                className="bg-transparent p-0 font-bold text-indigo-600 hover:text-indigo-500"
              >
                {isRegisterMode ? "Login here" : "Create one"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
export default AuthPage;
