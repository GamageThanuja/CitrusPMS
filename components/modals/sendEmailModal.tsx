// Changes across files:
// 1) components/modals/sendEmailModal.tsx — make it a controlled modal (open/email/sending/onSend)
// 2) components/drawers/invoice-print-drawer.tsx — add Email button in header, wire modal + sendCustomEmail

// --- components/modals/sendEmailModal.tsx ---
import { Send, X } from "lucide-react";
import React from "react";

type SendEmailModalProps = {
  open: boolean;
  email: string;
  onEmailChange: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
  sending?: boolean;
  title?: string;
};

export function SendEmailModal({
  open,
  email,
  onEmailChange,
  onClose,
  onSend,
  sending = false,
  title = "Send Invoice",
}: SendEmailModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40">
      <div className="w-[92vw] max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="guest@example.com"
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
