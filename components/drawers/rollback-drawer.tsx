"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type RollbackDrawerProps = {
  bookingDetail: {
    reservationDetailID?: number | null;
    reservationNo?: string | number | null;
    currentStatusId?: number | null;
  };
  onClose: () => void;
  onConfirm: (payload: {
    reservationDetailId: number;
    reason?: string;
    toStatusId?: number;
  }) => Promise<void> | void;
};

export default function RollbackDrawer({
  bookingDetail,
  onClose,
  onConfirm,
}: RollbackDrawerProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!bookingDetail.reservationDetailID && !submitting;

  const handleConfirm = async () => {
    if (!bookingDetail.reservationDetailID) return;
    try {
      setSubmitting(true);
      await onConfirm({
        reservationDetailId: bookingDetail.reservationDetailID,
        reason,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Rollback Booking</h2>
        <p className="text-sm text-muted-foreground">
          Reservation No:{" "}
          <span className="font-medium">
            {bookingDetail?.reservationNo ?? "—"}
          </span>
        </p>
      </div>

      <Separator />

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rollback-reason">Reason (optional)</Label>
          <Textarea
            id="rollback-reason"
            placeholder="Add a note about why you're rolling back…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium mb-1">What this does</div>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              Reverts this room’s status to the prior/allowed state (e.g.,
              Confirmed).
            </li>
            <li>Keeps folio/charges intact.</li>
            <li>
              Logs your reason in the audit trail (if your backend supports it).
            </li>
          </ul>
        </div>
      </div>

      <Separator />

      <div className="p-4 mt-auto flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Close
        </Button>
        <Button onClick={handleConfirm} disabled={!canSubmit}>
          {submitting ? "Rolling back…" : "Confirm Rollback"}
        </Button>
      </div>
    </div>
  );
}
