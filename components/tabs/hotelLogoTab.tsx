// @ts-nocheck
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";

// thunks
import { createHotelImage } from "@/redux/slices/hotelImageSlice"; // <- the slice you provided
import { updateHotel } from "@/redux/slices/updateHotelSlice";

type Props = { hotelData: any };

const toBase64 = (file: File) =>
  new Promise<{ base64: string; mime: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [prefix, data] = result.split(",");
      const mime =
        (prefix?.match(/^data:(.+);base64$/)?.[1] as string | undefined) ||
        "image/jpeg";
      resolve({ base64: data, mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function HotelLogoTab({ hotelData }: Props) {
  const dispatch = useDispatch();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLogo = hotelData?.logoURL as string | undefined;

  const fileName = useMemo(() => {
    if (!file) return "";
    const ext = file.name.split(".").pop() || "jpg";
    const safeHotel = String(hotelData?.hotelID || "hotel");
    return `logo-${safeHotel}-${Date.now()}.${ext}`;
  }, [file, hotelData?.hotelID]);

  const uploadLogoAndSave = async () => {
    if (!file) return;
    if (!hotelData?.hotelID) {
      setError("Hotel not loaded yet.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1) convert to base64 (without the data: prefix)
      const { base64 } = await toBase64(file);
      const now = new Date().toISOString();

      // 2) upload via your createHotelImage thunk (it will inject hotelID from localStorage)
      const uploaded: any = await (
        dispatch(
          createHotelImage({
            imageID: 0,
            imageFileName: fileName,
            description: "Hotel Logo",
            isMain: false,
            finAct: false,
            createdOn: now,
            createdBy: "HotelLogoTab",
            updatedOn: now,
            updatedBy: "HotelLogoTab",
            base64Image: base64,
            bucketName: "hotellogo", // <- important
          })
        ) as any
      ).unwrap();

      // Optional: inspect full upload response
      console.log(
        "[HotelLogoTab] createHotelImage response:",
        JSON.stringify(uploaded, null, 2)
      );

      // 3) extract the public URL from API response (handle a few common shapes)
      const publicUrl: string =
        uploaded?.publicUrl ||
        uploaded?.url ||
        uploaded?.imageUrl ||
        uploaded?.imageFileName || // sometimes full URL is returned here
        "";

      if (!publicUrl) {
        throw new Error("Upload did not return a public URL.");
      }

      // 4) update hotel with logoURL
      const hotelPatch = { ...hotelData, logoURL: publicUrl };

      // ✅ JSON log of hotel update payload
      console.log(
        "[HotelLogoTab] updateHotel payload:",
        JSON.stringify(hotelPatch, null, 2)
      );

      await (dispatch(updateHotel(hotelPatch)) as any).unwrap();

      // 5) clear local UI
      setFile(null);
      setPreview("");
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ||
          e?.response?.data ||
          e?.message ||
          "Upload failed. Try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Hotel Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Logo */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Current logo</Label>
          <div className="flex items-center gap-4">
            {currentLogo ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-white">
                <Image
                  src={currentLogo}
                  alt="Hotel logo"
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No logo set yet
              </div>
            )}
          </div>
        </div>

        {/* Upload New */}
        <div className="space-y-2">
          <Label>Upload new logo</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setError(null);
              const f = e.target.files?.[0] || null;
              setFile(f);
              setPreview(f ? URL.createObjectURL(f) : "");
            }}
          />
          {preview && (
            <div className="mt-3">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-white">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="object-contain p-1"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button disabled={!file || uploading} onClick={uploadLogoAndSave}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload & Save
              </>
            )}
          </Button>

          {file && !uploading && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreview("");
                setError(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Tip: Use a square PNG/SVG or a transparent background for best
          results.
        </p>
      </CardContent>
    </Card>
  );
}
