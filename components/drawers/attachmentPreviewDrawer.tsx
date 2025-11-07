"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";

type DrawerFile = {
  url: string;
  type: string; // can be MIME (e.g., "image/png") OR extension (e.g., "png" / "pdf")
  name?: string;
};

function isImageType(t: string) {
  const s = t.toLowerCase();
  return (
    s.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(s)
  );
}
function isPdfType(t: string) {
  const s = t.toLowerCase();
  return s.includes("pdf") || s === "pdf";
}

async function downloadViaBlob(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    // Fallback: open in new tab if direct download fails (CORS, etc.)
    window.open(url, "_blank");
  }
}

export default function AttachmentPreviewDrawer({
  open,
  onClose,
  file,
  side = "left", // change to "right" if you prefer
}: {
  open: boolean;
  onClose: () => void;
  file: DrawerFile | null;
  side?: "left" | "right" | "top" | "bottom";
}) {
  const [zoom, setZoom] = useState(1);

  const safeName = useMemo(() => {
    if (!file?.name) return "Attachment";
    // strip querystrings from names if they came from URLs
    try {
      const u = new URL(file.name, window.location.href);
      return u.pathname.split("/").pop() || file.name;
    } catch {
      return file.name;
    }
  }, [file]);

  if (!file) return null;

  const img = isImageType(file.type);
  const pdf = isPdfType(file.type);

  const handleDownload = () => {
    // try blob-download first for better filename; fall back to new tab
    downloadViaBlob(file.url, safeName);
  };

  const zoomIn = () =>
    setZoom((z) => Math.min(4, Math.round((z + 0.1) * 10) / 10));
  const zoomOut = () =>
    setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10));

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-r-2xl data-[state=open]:animate-in"
      >
        <div className="p-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">{safeName}</h2>
              <p className="text-xs text-muted-foreground truncate">
                {file.url}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {img && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={zoomOut}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs w-10 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={zoomIn}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-md bg-white p-2">
            {img ? (
              <div className="w-full overflow-auto">
                <img
                  src={file.url}
                  alt={safeName}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  className="max-w-none h-auto rounded"
                />
              </div>
            ) : pdf ? (
              <iframe
                src={file.url}
                className="w-full h-[78vh] rounded"
                title={safeName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                <p>Preview not supported for this file type.</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
