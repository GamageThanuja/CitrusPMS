"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { createReservationAttachment } from "@/controllers/reservationAttachmentController";

const allowedExtensions = ["jpg", "jpeg", "png", "pdf", "doc", "docx"];

export default function AttachmentUploader({
  selectedDocType,
  setSelectedDocType,
  bookingDetail,
  refreshAttachments,
}: {
  selectedDocType: string;
  setSelectedDocType: (val: string) => void;
  bookingDetail: any;
  refreshAttachments: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      alert(`Unsupported file type: ${ext}`);
      return;
    }

    setFile(selected);
    if (["jpg", "jpeg", "png"].includes(ext)) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadFile = async () => {
    if (!file || !bookingDetail) return;

    setUploading(true);
    setProgress(0);

    const reader = new FileReader();
    const base64File: string = await new Promise((resolve, reject) => {
      reader.onloadend = () => {
        resolve((reader.result as string).split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const storedToken = localStorage.getItem("hotelmateTokens");
    const token = storedToken ? JSON.parse(storedToken).accessToken : null;
    if (!token) {
      alert("No token");
      return;
    }

    const payload = {
      reservationID: bookingDetail.reservationID,
      reservationDetailID: bookingDetail.reservationDetailID,
      createdBy: bookingDetail.createdBy || "system",
      base64File,
      description: selectedDocType,
      originalFileName: file.name,
    };

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      await createReservationAttachment({ token, payload });
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setFile(null);
        setPreviewUrl(null);
        setProgress(0);
        refreshAttachments();
        setUploading(false);
      }, 500);
    } catch (err) {
      setUploading(false);
      alert("Upload failed");
      console.error(err);
    }
  };

  return (
    <div className="border rounded-md p-4 bg-muted/20 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Document Type */}
        <div>
          <label className="text-sm font-medium block mb-1">
            Document type
          </label>
          <select
            className="w-full border rounded-md p-2 text-sm"
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
          >
            <option value="Booking Voucher">Booking Voucher</option>
            <option value="Passport / NIC">Passport / NIC</option>
            <option value="Payment Slip">Payment Slip</option>
            <option value="Visa Document">Visa Document</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* File input */}
        <div>
          <label className="text-sm font-medium block mb-1">Choose File</label>
          <Input type="file" onChange={onFileChange} />
        </div>

        {/* Upload */}
        <div className="pt-6">
          <Button
            onClick={uploadFile}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? `Uploading... ${progress}%` : "Upload"}
          </Button>
        </div>
      </div>

      {/* Preview */}
      {file && (
        <div className="flex items-center gap-4 pt-2">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="w-28 h-28 object-cover rounded-md border"
            />
          ) : (
            <div className="w-28 h-28 flex items-center justify-center bg-gray-100 text-sm text-gray-500 rounded-md border">
              {file.name.split(".").pop()?.toUpperCase()} file
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-sm">{file.name}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="mt-2"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
