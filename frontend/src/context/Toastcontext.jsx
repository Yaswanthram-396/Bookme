import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    message: "",
    show: false,
    type: "success",
  });
  const [timeoutId, setTimeoutId] = useState(null);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, show: true, type });
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      setToast({ message: "", show: false, type });
    }, duration);
    setTimeoutId(id);
  };
  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      <div
        className={`fixed bottom-6 right-6 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow
    ${
      toast.show
        ? "translate-y-0 opacity-100"
        : "translate-y-8 opacity-0 pointer-events-none"
    } ${
      toast.type === "success"
        ? "bg-slate-900 text-white"
        : "bg-red-600 text-white"
    }`}
      >
        {toast.type === "success" ? (
          <BadgeCheck className="w-5 h-5 text-emerald-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-white" />
        )}

        <p className="font-medium text-sm">{toast.message}</p>
      </div>
    </ToastContext.Provider>
  );
};
