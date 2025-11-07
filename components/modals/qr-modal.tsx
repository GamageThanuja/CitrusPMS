"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal, // ← add
} from "@/components/ui/dialog";

type QRModalCtx = {
  showQR: (url: string, title?: string) => Promise<void>;
  hideQR: () => void;
};

const Ctx = createContext<QRModalCtx | null>(null);

export function QRModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(
    "Scan this QR code to access the Guest Self-Service"
  );
  const [qrSrc, setQrSrc] = useState<string>("");
  const [urlShown, setUrlShown] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const showQR = useCallback(async (url: string, customTitle?: string) => {
    setTitle(
      customTitle || "Scan this QR code to access the Guest Self-Service"
    );
    setUrlShown(url);
    setBusy(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 560, margin: 1 });
      setQrSrc(dataUrl);
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }, []);

  const hideQR = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ showQR, hideQR }), [showQR, hideQR]);

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Global, body-level dialog with very high z-index */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/60 z-[20000]" />
          <DialogContent className="sm:max-w-lg z-[20001]">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR"
                  className="w-[360px] h-[360px] object-contain"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {busy ? "Generating..." : "No QR"}
                </div>
              )}
              {!!urlShown && (
                <div className="text-xs text-muted-foreground text-center break-all">
                  {urlShown}
                </div>
              )}
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useQRModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQRModal must be used within QRModalProvider");
  return ctx;
}
