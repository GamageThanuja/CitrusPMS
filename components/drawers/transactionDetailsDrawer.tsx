"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Transaction } from "@/redux/slices/transactionSlice";

interface Props {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onToggleFinAct: (tranMasId: number, currentFinAct: boolean) => void;
}

export function TransactionDetailDrawer({
  open,
  onClose,
  transaction,
  onToggleFinAct,
}: Props) {
  const [confirmingVoid, setConfirmingVoid] = useState(false);

  if (!transaction) return null;

  const handleVoidClick = () => setConfirmingVoid(true);
  const handleCancelVoid = () => setConfirmingVoid(false);
  const handleConfirmVoid = () => {
    onToggleFinAct(transaction.tranMasId, transaction.finAct);
    setConfirmingVoid(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            Transaction Detail
          </SheetTitle>
        </SheetHeader>
        <hr className="my-4 border-t border-muted" />

        <ScrollArea className="h-[calc(100%-100px)] pr-2">
          <div className="mt-6 rounded-xl bg-muted/40 p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <InfoRow label="Document No" value={transaction.docNo} />
              <InfoRow
                label="Reservation No"
                value={transaction.reservationNo}
              />
              <InfoRow
                label="Date"
                value={new Date(transaction.tranDate).toLocaleString()}
              />
              <InfoRow label="Guest" value={transaction.guest1} />
              <InfoRow
                label="Payment Method"
                value={transaction.paymentMethod || "-"}
              />
              <InfoRow
                label="Amount"
                value={`$${transaction.tranValue.toFixed(2)}`}
              />
              <InfoRow label="Type" value={transaction.tranType} />
              <InfoRow
                label="Status"
                value={transaction.finAct ? "Voided" : "Active"}
              />
              <InfoRow label="Room No" value={transaction.roomNo} />
              <InfoRow
                label="Created On"
                value={new Date(transaction.createdOn).toLocaleString()}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>

            {transaction.finAct ? (
              // Unvoid (no confirm)
              <Button
                variant="secondary"
                onClick={() =>
                  onToggleFinAct(transaction.tranMasId, transaction.finAct)
                }
              >
                Set Active (Unvoid)
              </Button>
            ) : confirmingVoid ? (
              // Inline confirm state
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Void <b>{transaction.docNo}</b> for $
                  {transaction.tranValue.toFixed(2)}?
                </span>
                <Button variant="ghost" onClick={handleCancelVoid}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmVoid}>
                  Confirm Void
                </Button>
              </div>
            ) : (
              // Initial "Void" button
              <Button variant="destructive" onClick={handleVoidClick}>
                Void Transaction
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
        {label}
      </span>
      <span className="text-base text-foreground font-semibold break-words">
        {value}
      </span>
    </div>
  );
}
