"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: "border-emerald-500/30",
  error: "border-red-500/30",
  warning: "border-amber-500/30",
  info: "border-blue-500/30",
};

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 200);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl bg-surface/90 shadow-2xl transition-all duration-200 max-w-sm ${
        BORDER_COLORS[toast.type]
      } ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}
    >
      {ICONS[toast.type]}
      <p className="text-sm text-foreground flex-1 break-words">{toast.message}</p>
      <button
        onClick={() => { setExiting(true); setTimeout(onDismiss, 200); }}
        className="text-muted hover:text-foreground transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setMounted(true); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]); // max 5
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    success: useCallback((msg: string) => addToast("success", msg), [addToast]),
    error: useCallback((msg: string) => addToast("error", msg), [addToast]),
    warning: useCallback((msg: string) => addToast("warning", msg), [addToast]),
    info: useCallback((msg: string) => addToast("info", msg), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
          {toasts.map((t) => (
            <ToastMessage key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
