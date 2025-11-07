"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  format,
  parseISO,
  isValid,
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import { toast } from "sonner";
import {
  CalendarDays,
  BedDouble,
  Loader2,
  Moon,
  Sun,
  Calendar as CalendarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import {
  changeReservationDate,
  resetChangeDateState,
} from "@/redux/slices/changeReservationDateSlice";

// Accept your booking object shape directly
type RawBooking = {
  reservationDetailID?: number;
  reservationDetailId?: number;
  reservationID?: number;
  resCheckIn?: string;
  resCheckOut?: string;
  checkINat?: string;
  roomId?: string | number;
  nights?: number;
  totalNights?: number;
  currencyCode?: string;
  roomType?: string;
  guestName?: string;
  guest?: string;
  amount?: string;
  totalAmount?: number;
};

type Props = {
  bookingDetail: RawBooking | null;
  onClose?: () => void;
  // Optional overrides
  rate?: number;
  currencyCode?: string;
  mealPlan?: string;
};

export function ChangeDateDrawer({
  bookingDetail,
  onClose,
  rate = 0,
  currencyCode = "LKR",
  mealPlan = "RO",
}: Props) {
  if (!bookingDetail) return null;

  const dispatch = useDispatch<any>();
  const { loading, error } = useSelector(
    (s: any) => s.changeReservationDate || {}
  );

  // --- Normalize source fields from your object ---
  const oldCheckInISO =
    bookingDetail.resCheckIn ?? bookingDetail.checkINat ?? "";
  const oldCheckOutISO = bookingDetail.resCheckOut ?? "";

  const oldCheckInDate = useMemo(() => {
    const d = parseISO(String(oldCheckInISO));
    return isValid(d) ? d : undefined;
  }, [oldCheckInISO]);

  const oldCheckOut = useMemo(() => {
    const d = parseISO(String(oldCheckOutISO));
    return isValid(d) ? d : undefined;
  }, [oldCheckOutISO]);

  // Prefer provided nights; otherwise compute
  const lockedNights = useMemo(() => {
    if (Number.isFinite(bookingDetail.nights))
      return Number(bookingDetail.nights);
    if (Number.isFinite(bookingDetail.totalNights))
      return Number(bookingDetail.totalNights);
    if (oldCheckInDate && oldCheckOut)
      return Math.max(0, differenceInCalendarDays(oldCheckOut, oldCheckInDate));
    return 0;
  }, [
    bookingDetail.nights,
    bookingDetail.totalNights,
    oldCheckInDate,
    oldCheckOut,
  ]);

  // Coerce ids
  const reservationDetailId =
    bookingDetail.reservationDetailID ?? bookingDetail.reservationDetailId ?? 0;
  const reservationMasterId = bookingDetail.reservationID ?? 0;
  const roomIdNum = Number(bookingDetail.roomId ?? 0);

  // ---------- Field-triggered calendar popovers ----------
  const [checkInOpen, setCheckInOpen] = useState(false);

  // Keep a Date for new check-in (default to current)
  const [newCheckInDate, setNewCheckInDate] = useState<Date | undefined>(
    oldCheckInDate
  );
  // Checkout always snaps to keep same nights
  const newCheckOutDate = useMemo(
    () => (newCheckInDate ? addDays(newCheckInDate, lockedNights) : undefined),
    [newCheckInDate, lockedNights]
  );

  // Input-friendly value (read-only text field)
  const checkInLabel = newCheckInDate ? format(newCheckInDate, "PP") : "";
  const checkOutLabel = newCheckOutDate ? format(newCheckOutDate, "PP") : "";

  // Optional pricing fields
  const [localRate, setLocalRate] = useState<number>(rate);
  const [localCurrency, setLocalCurrency] = useState<string>(
    bookingDetail.currencyCode || currencyCode
  );

  // Derive meal plan (basis) from reservation slice by reservationDetailId (no slice changes)
  const basisFromReservation: string | null = useSelector((s: any) => {
    const data = s.reservation?.data;
    if (!data?.rooms || !reservationDetailId) return null;
    const room = data.rooms.find(
      (r: any) => Number(r.reservationDetailID) === Number(reservationDetailId)
    );
    return room?.basis ?? null; // e.g., "FB"
  });

  const [localMealPlan, setLocalMealPlan] = useState<string>(
    (basisFromReservation || mealPlan || "RO").toUpperCase()
  );

  const { success } = useSelector((s: any) => s.changeReservationDate || {});

  // Close on success and clean slice
  useEffect(() => {
    if (success) {
      onClose?.();
      // optional: also collapse any open popovers
      setCheckInOpen(false);
      // reset slice so the next open starts clean
      setTimeout(() => dispatch(resetChangeDateState()), 0);
    }
  }, [success, onClose, dispatch]);

  useEffect(() => {
    if (basisFromReservation)
      setLocalMealPlan(basisFromReservation.toUpperCase());
  }, [basisFromReservation]);

  const handleSubmit = async () => {
    if (
      !oldCheckInDate ||
      !oldCheckOut ||
      !newCheckInDate ||
      !newCheckOutDate
    ) {
      toast.error("Missing dates. Ensure both old and new dates exist.");
      return;
    }
    if (!reservationDetailId) {
      toast.error("Missing reservation detail ID.");
      return;
    }
    if (!reservationMasterId) {
      toast.error("Missing reservation master ID.");
      return;
    }

    const payload = {
      reservationDetailId,
      reservationMasterId,
      roomId: roomIdNum || 0,
      newCheckInDate: newCheckInDate.toISOString(),
      oldCheckInDate: oldCheckInDate.toISOString(),
      oldCheckOutDate: oldCheckOut.toISOString(),
      newCheckOutDate: newCheckOutDate.toISOString(),
      hotelCode: 0, // overridden in slice by selectedProperty.id
      rate: Number(localRate) || 0,
      currencyCode: (localCurrency || "LKR").toUpperCase(),
      mealPlan: (localMealPlan || "RO").toUpperCase(),
    };

    const action = await dispatch(changeReservationDate(payload));
    if (changeReservationDate.fulfilled.match(action)) {
      toast.success("Reservation dates updated");
      onClose?.();
      setTimeout(() => dispatch(resetChangeDateState()), 250);
    } else {
      const msg =
        (action.payload && (action.payload.detail || action.payload.title)) ||
        "Failed to update dates";
      toast.error(msg);
    }
  };

  const nights = lockedNights;

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Change Reservation Dates</CardTitle>
          <CardDescription>
            Click the check-in field to pick a date. Check-out snaps to keep{" "}
            {nights} night{nights === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Top context line */}
          <div className="text-sm text-muted-foreground">
            {bookingDetail.roomType ? (
              <>
                Guest{" "}
                <span className="font-medium">
                  {bookingDetail.guestName || bookingDetail.guest || "—"}
                </span>{" "}
                • Room{" "}
                <span className="font-medium">{bookingDetail.roomType}</span>
              </>
            ) : (
              <>
                Guest{" "}
                <span className="font-medium">
                  {bookingDetail.guestName || bookingDetail.guest || "—"}
                </span>
              </>
            )}
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current */}
            <div className="rounded-xl border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Current
              </div>
              <div className="mt-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Check-in:</span>{" "}
                  <span className="font-medium">
                    {oldCheckInDate ? format(oldCheckInDate, "PP") : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>{" "}
                  <span className="font-medium">
                    {oldCheckOut ? format(oldCheckOut, "PP") : "—"}
                  </span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                  <BedDouble className="h-3 w-3" /> {nights} night
                  {nights === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            {/* New */}
            <div className="rounded-xl border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sun className="h-4 w-4" />
                New
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {/* New Check-in FIELD that opens a calendar */}
                <div className="col-span-1 flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    New check-in
                  </Label>

                  <Popover
                    open={checkInOpen}
                    onOpenChange={setCheckInOpen}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      {/* Use Input as the trigger (readOnly so keyboard doesn't bring native picker) */}
                      <div className="relative">
                        <Input
                          value={checkInLabel}
                          readOnly
                          placeholder="Pick a date"
                          className="pr-9 cursor-pointer"
                          onClick={() => setCheckInOpen(true)}
                        />
                        <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      sideOffset={6}
                      className="p-0 z-[90] w-auto"
                    >
                      <Calendar
                        mode="single"
                        selected={newCheckInDate}
                        onSelect={(d) => {
                          if (!d) return;
                          setNewCheckInDate(d);
                          // Close after picking
                          setCheckInOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Computed New Check-out (read-only) */}
                <div className="col-span-1 flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    New check-out
                  </Label>
                  <Input value={checkOutLabel} readOnly />
                </div>

                {/* Nights locked */}
                <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Moon className="h-3.5 w-3.5" />
                  Nights are fixed at{" "}
                  <span className="font-medium text-foreground">{nights}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Optional pricing fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Rate</Label>
              <Input
                type="number"
                value={Number.isFinite(localRate) ? String(localRate) : ""}
                onChange={(e) => setLocalRate(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Currency</Label>
              <Input
                value={localCurrency || ""}
                onChange={(e) => setLocalCurrency(e.target.value.toUpperCase())}
                placeholder="USD / LKR"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Meal plan</Label>
              <Input value={localMealPlan} readOnly />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                onClose?.();
                setTimeout(() => dispatch(resetChangeDateState()), 200);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !newCheckInDate || !newCheckOutDate}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply change
            </Button>
          </div>

          {/* Error bubble */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <span className="font-medium">Error:</span>{" "}
              {typeof error === "string" ? error : JSON.stringify(error)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
