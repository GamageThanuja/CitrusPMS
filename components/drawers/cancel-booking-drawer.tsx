"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
// ✅ match slice file & key
import { getReasons } from "@/controllers/reasonsMasterController";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  cancelReservation,
  resetCancelReservationState,
} from "@/redux/slices/cancelReservationByRoomSlice";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import { useHotelLogo } from "@/hooks/useHotelLogo";

type BookingType = {
  id?: string | number;
  guest?: string;
  roomType?: string;
  roomNumber?: string;
  nights?: number;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  reservationNo?: string;
  // API identifiers
  reservationID: number | string; // ✅ used by payload
  reservationDetailID: number; // ✅ used by payload and room cancel endpoint
  reservationStatusId?: number | string; // optional
  createdBy?: string; // optional
};

type DrawerProps = {
  bookingDetail: BookingType | null;
  isOpen: boolean;
  onClose: () => void;
};

type ReasonItem = {
  id: string;
  reason: string;
  category: string;
};

export function CancelBookingDrawer({
  bookingDetail,
  isOpen,
  onClose,
}: DrawerProps) {
  const dispatch = useAppDispatch();

  // ✅ selector path matches slice key you will add to store: state.cancelReservationByRoom
  const { loading } = useAppSelector((s) => s.cancelReservationByRoom);
  console.log("booking detail cancel : ", bookingDetail);

  const [reasonsList, setReasonsList] = useState<ReasonItem[]>([]);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logoUrl } = useHotelLogo();

  const buildCancelEmailHTML = ({
    logoUrl,
    hotelName,
    reservationNo,
    guestName,
    roomLine,
    stayLine,
    cancelReason,
    cancelledOnISO,
  }: {
    logoUrl?: string;
    hotelName: string;
    reservationNo?: string;
    guestName?: string;
    roomLine?: string;
    stayLine?: string;
    cancelReason: string;
    cancelledOnISO: string;
  }) => {
    const cancelledOn = new Date(cancelledOnISO);
    const niceDate = cancelledOn.toLocaleString();

    return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Reservation Cancellation</title>
      <style>
        .wrapper{max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e6e6e6;border-radius:12px}
        .header{padding:20px 24px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:12px}
        .logo{max-height:36px}
        .brand{font:600 16px ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial}
        .body{padding:24px 24px 12px 24px;font:400 14px ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;color:#0f172a}
        .muted{color:#475569}
        .pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;font:600 12px ui-sans-serif}
        .row{margin-top:12px}
        .card{margin-top:12px;padding:14px;border:1px dashed #e5e7eb;border-radius:10px;background:#fafafa}
        .footer{padding:16px 24px;border-top:1px solid #eee;color:#64748b;font:400 12px ui-sans-serif}
        a{color:#0ea5e9;text-decoration:none}
      </style>
    </head>
    <body style="background:#f6f7fb;padding:18px">
      <div class="wrapper">
        <div class="header">
          ${
            logoUrl
              ? `<img src="${logoUrl}" alt="${hotelName} Logo" class="logo" />`
              : ""
          }
          <div class="brand">${hotelName || "Our Hotel"}</div>
        </div>

        <div class="body">
          <div class="pill">Reservation Cancelled</div>

          <div class="row">
            <p>Hi${guestName ? ` ${guestName}` : ""},</p>
            <p>
              This is to confirm your reservation has been <strong>cancelled</strong>.
              If this was unintentional, please contact us as soon as possible.
            </p>
          </div>

          <div class="card">
            ${
              reservationNo
                ? `<div><strong>Reservation No:</strong> ${reservationNo}</div>`
                : ""
            }
            ${roomLine ? `<div><strong>Room:</strong> ${roomLine}</div>` : ""}
            ${stayLine ? `<div><strong>Stay:</strong> ${stayLine}</div>` : ""}
            <div><strong>Cancelled on:</strong> ${niceDate}</div>
            <div><strong>Reason:</strong> ${cancelReason}</div>
          </div>

          <div class="row muted">
            <p>If you need assistance rebooking, reply to this email and our team will help.</p>
          </div>
        </div>

        <div class="footer">
          <div>${hotelName || "Our Hotel"}</div>
          <div>Powered by HotelMate</div>
        </div>
      </div>
    </body>
  </html>
  `;
  };

  // friendly fallbacks
  const cancelledBy = useMemo(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("userClaims") : null;
    const claims = raw ? JSON.parse(raw) : null;
    return (
      bookingDetail?.createdBy || claims?.fullName || claims?.email || "System"
    );
  }, [bookingDetail]);

  // Load reasons only when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchReasons = async () => {
      try {
        const tokensRaw = localStorage.getItem("hotelmateTokens");
        const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
        const accessToken = tokens?.accessToken;
        if (!accessToken) return;

        const reasons = await getReasons({ token: accessToken });
        const filtered: ReasonItem[] = (reasons || [])
          .filter((r: any) => r?.category === "Reservation Cancellation")
          .map((r: any) => ({
            id: String(r.reasonId),
            reason: r.reason,
            category: r.category,
          }));
        setReasonsList(filtered);
      } catch (err) {
        console.error("Failed to fetch cancellation reasons", err);
      }
    };

    // Reset state each time the drawer opens
    setCancelReason("");
    setIsSubmitting(false);
    dispatch(resetCancelReservationState());

    fetchReasons();
  }, [isOpen, dispatch]);

  const handleConfirm = async () => {
    if (!bookingDetail) return;
    if (!cancelReason.trim()) {
      toast.error("Please select a cancellation reason");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      reservationId: bookingDetail.reservationID,
      reservationDetailId: bookingDetail.reservationDetailID,
      reservationStatusId: 5,
      status: "Cancelled" as const,
      cancelReason,
      cancelledBy,
      cancelledOn: new Date().toISOString(),
    };

    // Helpful debug
    console.log("[CancelReservation] Payload:", payload);

    try {
      await dispatch(cancelReservation(payload)).unwrap();
      toast.success("Reservation cancelled successfully");
      dispatch(resetCancelReservationState());

      const hotelJson =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedProperty")
          : null;
      const hotelObj = hotelJson ? JSON.parse(hotelJson) : {};
      const hotelName = hotelObj?.hotelName || hotelObj?.name || "Our Hotel";

      // Try to pick a guest email from your booking object
      const toEmail =
        (bookingDetail as any)?.guestEmail ||
        (bookingDetail as any)?.email ||
        (bookingDetail as any)?.guest_email ||
        ""; // keep empty if unknown

      // Lines for the email body
      const roomLine = [
        bookingDetail.roomType || "",
        bookingDetail.roomNumber ? `(${bookingDetail.roomNumber})` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const stayLine = [
        bookingDetail.checkIn || "—",
        "→",
        bookingDetail.checkOut || "—",
      ].join(" ");

      const htmlBody = buildCancelEmailHTML({
        logoUrl,
        hotelName,
        reservationNo: bookingDetail.reservationNo,
        guestName: bookingDetail.guest,
        roomLine,
        stayLine,
        cancelReason,
        cancelledOnISO: payload.cancelledOn,
      });

      // Only attempt sending if we have a recipient
      if (toEmail) {
        try {
          await dispatch(
            sendCustomEmail({
              toEmail,
              subject: `${hotelName} – Reservation ${
                bookingDetail.reservationNo || ""
              } cancelled`,
              body: htmlBody,
              isHtml: true,
              senderName: hotelName,
            })
          ).unwrap();
          // optional: toast.success("Cancellation email sent");
        } catch (e: any) {
          console.error("[Email] Failed to send cancellation email:", e);
          // optional: toast.error("Cancelled, but failed to send email");
        }
      }
      setCancelReason("");

      onClose();
    } catch (error: any) {
      console.error("[CancelReservation] Failed:", error);
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Cancellation failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !bookingDetail) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Cancel Booking</h2>
          {bookingDetail.reservationNo && (
            <p className="mt-1 text-sm text-muted-foreground">
              Reservation No: {bookingDetail.reservationNo}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="rounded-md bg-muted p-4 space-y-2">
            <p className="text-sm">
              Are you sure you want to cancel this booking
              {bookingDetail.guest ? (
                <>
                  {" "}
                  for <strong>{bookingDetail.guest}</strong>?
                </>
              ) : (
                "?"
              )}
            </p>
            {(bookingDetail.roomType || bookingDetail.roomNumber) && (
              <p className="text-sm text-muted-foreground">
                Room: {bookingDetail.roomType || "N/A"}{" "}
                {bookingDetail.roomNumber
                  ? `(${bookingDetail.roomNumber})`
                  : ""}
              </p>
            )}
            {(bookingDetail.checkIn || bookingDetail.checkOut) && (
              <p className="text-xs text-muted-foreground">
                Stay: {bookingDetail.checkIn || "—"} →{" "}
                {bookingDetail.checkOut || "—"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancelReason" className="text-sm font-medium">
              Reason for Cancellation{" "}
              <span className="text-destructive">*</span>
            </Label>
            <select
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Select a reason</option>
              {reasonsList.map((r) => (
                <option key={r.id} value={r.reason}>
                  {r.reason}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || loading}
          >
            Close
          </Button>
          <Button
            variant="destructive"
            className="w-28"
            onClick={handleConfirm}
            disabled={isSubmitting || loading || !cancelReason.trim()}
          >
            {isSubmitting || loading ? "Cancelling..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
