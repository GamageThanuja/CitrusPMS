// src/components/drawers/RecallDrawer.tsx
"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useAppDispatch } from "@/redux/hooks";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateReservationStatus } from "@/redux/slices/updateStatusByReservationDetailID";
import { Loader2 } from "lucide-react";

type RecallDrawerProps = {
  bookingDetail: {
    reservationDetailID: number;
    reservationNo?: string | number;
  };
  onClose: () => void; // parent will refresh + close sheet
};

export default function RecallDrawer({
  bookingDetail,
  onClose,
}: RecallDrawerProps) {
  const dispatch = useAppDispatch();
  const { updateStatusLoading } = useSelector((s: RootState) => s.reservation);

  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!bookingDetail?.reservationDetailID) {
      toast.error("Missing reservation detail id");
      return;
    }
    setSubmitting(true);
    const action = await dispatch(
      updateReservationStatus({
        reservationDetailId: bookingDetail.reservationDetailID,
        statusId: 4, // 4 = Recalled
      })
    );

    if (updateReservationStatus.fulfilled.match(action)) {
      toast.success("Booking recalled");
      onClose(); // parent will also refresh
    } else {
      toast.error((action.payload as string) || "Failed to recall booking");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Recall Booking</h2>
        <p className="text-sm text-muted-foreground">
          Reservation No: {bookingDetail?.reservationNo ?? "—"}
        </p>
      </div>
      <Separator />
      <div className="p-4 space-y-3">
        <p className="text-sm">
          This will change the reservation detail status to <b>Recalled</b> (ID:
          4).
        </p>
        <p className="text-xs text-muted-foreground">
          You can re-open or proceed with other actions later if needed.
        </p>
      </div>

      <div className="mt-auto p-4 flex justify-end gap-2 border-t bg-background">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={submitting || updateStatusLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={submitting || updateStatusLoading}
        >
          {submitting || updateStatusLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recalling…
            </>
          ) : (
            "Confirm Recall"
          )}
        </Button>
      </div>
    </div>
  );
}
