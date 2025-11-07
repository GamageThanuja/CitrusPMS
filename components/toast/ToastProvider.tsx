// src/components/toast/ToastProvider.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Variant = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  id?: string;
  title: string;
  description?: string;
  variant?: Variant;
  duration?: number; // ms
};

type ToastItem = Required<Omit<ToastOptions, "id">> & { id: string };

type ToastContextValue = {
  show: (opts: ToastOptions) => string; // returns id
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idSeq = useRef(0);

  // --- SSR-safe portal target ---
  const [mounted, setMounted] = useState(false);
  const portalElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Use (or create) a dedicated portal node
    let el = document.getElementById("toast-portal") as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = "toast-portal";
      document.body.appendChild(el);
    }
    portalElRef.current = el;

    return () => {
      // optional: keep the node for the lifetime of the app
      // document.body.removeChild(el!); // usually NOT needed in app shell
    };
  }, []);

  // Track timers so we can clear on unmount
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      // clear pending timeouts on provider unmount
      Object.values(timers.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback(
    (opts: ToastOptions) => {
      const id = opts.id ?? `t_${Date.now()}_${idSeq.current++}`;
      const variant: Variant = opts.variant ?? "info";
      const duration = opts.duration ?? 3500;
      const title = opts.title;
      const description = opts.description ?? "";

      setToasts((prev) => {
        const next = [...prev, { id, title, description, variant, duration }];
        return next.slice(-5); // cap stack size
      });

      if (duration > 0) {
        const handle = window.setTimeout(() => dismiss(id), duration);
        timers.current[id] = handle;
      }

      return id;
    },
    [dismiss]
  );

  const clear = useCallback(() => {
    setToasts([]);
    Object.values(timers.current).forEach((t) => clearTimeout(t));
    timers.current = {};
  }, []);

  const value = useMemo(
    () => ({ show, dismiss, clear }),
    [show, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && portalElRef.current
        ? createPortal(
            <ToastViewport toasts={toasts} onClose={dismiss} />,
            portalElRef.current
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ---------------- UI ---------------- */

const tone: Record<Variant, string> = {
  success: "bg-emerald-600 text-white border-emerald-700",
  error: "bg-rose-600 text-white border-rose-700",
  info: "bg-sky-600 text-white border-sky-700",
  warning: "bg-amber-600 text-white border-amber-700",
};

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed top-4 right-4 z-[2147483647] flex w-full max-w-[420px] flex-col gap-3"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const base =
    "pointer-events-auto rounded-xl border shadow-xl p-4 flex gap-3 items-start transition-all duration-200";
  const anim = show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1";

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className={`${base} ${anim} ${tone[toast.variant]}`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{toast.title}</div>
        {toast.description ? (
          <div className="text-sm/5 opacity-90 break-words mt-0.5">
            {toast.description}
          </div>
        ) : null}
      </div>
      <button
        aria-label="Close notification"
        onClick={onClose}
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/15 hover:bg-white/25 transition"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6 L6 18" />
          <path d="M6 6 L18 18" />
        </svg>
      </button>
    </div>
  );
}

// use as this
//const { show } = useToast();
//  show({
//     variant: "success",
//     title: "Recorded successfully!",
//     description: "Expense recorded successfully!",
//   });
