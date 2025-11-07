// src/components/toast/useAppToast.ts
"use client";
import { useToast } from "./ToastProvider";

export function useAppToast() {
  const { show, dismiss, clear } = useToast();
  return {
    show,
    dismiss,
    clear,
    success: (title: string, description?: string, duration = 3500) =>
      show({ variant: "success", title, description, duration }),
    error: (title: string, description?: string, duration = 5000) =>
      show({ variant: "error", title, description, duration }),
    info: (title: string, description?: string, duration = 3500) =>
      show({ variant: "info", title, description, duration }),
    warning: (title: string, description?: string, duration = 4000) =>
      show({ variant: "warning", title, description, duration }),
  };
}
