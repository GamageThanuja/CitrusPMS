"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CircleCheckBig } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchTransactionCodes } from "@/redux/slices/transactionCodeSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type GroupContext = {
  isGroup: boolean;
  detailIds: number[];
  actionLabel?: string;
  selectedRooms?: Array<{
    reservationDetailID: number;
    roomNumber?: string | number;
    roomType?: string;
    guest1?: string;
  }>;
} | null;

type DrawerProps = {
  bookingDetail: {
    guest: string;
    roomType: string;
    roomNumber: string;
    nights: number;
    status: string;
    checkIn: string;
    checkOut: string;
    reservationDetailId: number;
    reservationID: number;
    bookerFullName?: string;
    guestName?: string;
    expenses?: any[];
    currencyCode?: string;
  };
  open: boolean;
  onClose: () => void;
  groupContext?: GroupContext;
};

export function PostCreditDrawer({
  open,
  onClose,
  bookingDetail,
  groupContext,
}: DrawerProps) {
  const dispatch = useAppDispatch();

  // ── Load transaction codes when the drawer opens
  const { data: tranCodes = [], status: tranCodeStatus } = useAppSelector(
    (s) => s.transactionCode || { data: [], status: "idle" }
  );

  console.log("tranCodes : ", tranCodes);

  useEffect(() => {
    if (open) {
      // only fetch if we don't already have data or we want to refresh each open
      if (!tranCodes?.length) dispatch(fetchTransactionCodes());
    }
  }, [open, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    baseAmount = 0,
    serviceCharge = 0,
    taxes = 0,
  } = useMemo(() => {
    const out = { baseAmount: 0, serviceCharge: 0, taxes: 0 };
    if (Array.isArray(bookingDetail?.expenses)) {
      for (const item of bookingDetail.expenses) {
        const desc = (item.description || "").toLowerCase();
        const val = parseFloat(item.amount || 0);
        if (desc.includes("service")) out.serviceCharge += val;
        else if (desc.includes("tax")) out.taxes += val;
        else out.baseAmount += val;
      }
    }
    return out;
  }, [bookingDetail?.expenses]);

  const [amount, setAmount] = useState("0");
  const [applyExtras, setApplyExtras] = useState(true);
  const [transactionTypeId, setTransactionTypeId] = useState<string>(""); // store ID as string for Select
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "error";
    message: string;
  } | null>(null);
  const [applyToAllSelected, setApplyToAllSelected] = useState(true);

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setAmount("0");
      setTransactionTypeId("");
      setFeedbackMessage(null);
      setApplyToAllSelected(true);
    }
  }, [open]);

  // ----- simple placeholder tax math (kept from your code) -----
  const numericAmountRaw = parseFloat(amount) || 0;
  const numericAmount = numericAmountRaw;

  const computedServiceCharge = applyExtras ? numericAmount * 0.1 : 0;
  const computedTax = applyExtras
    ? (numericAmount + computedServiceCharge) * 0.15
    : 0;
  const total = (numericAmount + computedServiceCharge + computedTax).toFixed(
    2
  );
  const currencyCode = bookingDetail?.currencyCode || "USD";

  const handleSubmit = async () => {
    // Form validation
    if (!transactionTypeId) {
      setFeedbackMessage({
        type: "error",
        message: "Please select a transaction type",
      });
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFeedbackMessage({
        type: "error",
        message: "Please enter a valid amount",
      });
      return;
    }

    const targetIds =
      groupContext?.isGroup && applyToAllSelected
        ? groupContext.detailIds ?? []
        : bookingDetail?.reservationDetailId
        ? [bookingDetail.reservationDetailId]
        : [];

    if (!targetIds.length) {
      setFeedbackMessage({ type: "error", message: "No rooms selected." });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelCode = selectedProperty.hotelCode;
      const createdBy = localStorage.getItem("fullName") || "unknown";

      const selectedTran = tranCodes.find(
        (t: any) => String(t.transactionID) === String(transactionTypeId)
      );
      const remarks = selectedTran?.tranName || "Credit/Discount";

      // function to build payload per room
      const makePayload = (reservationDetailId: number) => ({
        reservationDetailId,
        reservationMasterId: bookingDetail?.reservationID || 0,
        nameId: 0,
        hotelCode: hotelCode?.toString() || "",
        accountId: 0, // keep 0 if backend derives; swap to selectedTran?.accountId if applicable
        amount: numericAmount,
        tranDate: new Date().toISOString(),
        currencyCode,
        conversionRate: 1,
        remarks, // <- from API
        tranTypeId: 3, // Credit / Discount (unchanged)
        isTaxApplied: applyExtras,
        serviceChargeAmount: computedServiceCharge,
        vatTaxAmount: computedTax,
        exchangeRate: 1,
        createdBy,
        // optionally send transactionTypeId if your API expects it:
        // transactionID: Number(transactionTypeId),
      });

      const results = await Promise.allSettled(
        targetIds.map(async (id) => {
          const response = await fetch(
            `${BASE_URL}/api/Reservation/post-credit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(makePayload(id)),
            }
          );
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(text || `Failed to post credit for detailId ${id}`);
          }
          return response.json();
        })
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const bad = results.length - ok;

      if (ok) {
        toast.custom(
          () => (
            <div className="bg-background border border-border rounded-lg p-4 flex items-center gap-3">
              <CircleCheckBig className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-medium">
                  Posted credit for {ok} room{ok > 1 ? "s" : ""}.
                </h3>
              </div>
            </div>
          ),
          { duration: 2500 }
        );
      }
      if (bad) {
        toast.error(
          `Failed to post credit for ${bad} room${bad > 1 ? "s" : ""}.`
        );
      }

      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Error posting credit:", error);
      setFeedbackMessage({
        type: "error",
        message: "Failed to post credit. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const selectedCount = groupContext?.selectedRooms?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="
          z-[120]
          w-full sm:max-w-2xl h-full overflow-hidden rounded-l-2xl
          bg-white text-gray-900
          dark:bg-neutral-900 dark:text-white
        "
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Post Credit / Discount</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-[10px] p-4">
          {/* Group banner */}
          {groupContext?.isGroup && selectedCount > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    Group credit • {selectedCount} room
                    {selectedCount > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs opacity-80">
                    The same transaction and amount will be applied to all
                    selected rooms.
                  </div>
                </div>
                <label className="text-xs inline-flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={applyToAllSelected}
                    onChange={(e) => setApplyToAllSelected(e.target.checked)}
                  />
                  Apply to all
                </label>
              </div>

              {/* Chips: roomNumber • roomType */}
              {!!groupContext?.selectedRooms?.length && (
                <div className="max-h-24 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {groupContext.selectedRooms.map((r) => (
                    <div
                      key={r.reservationDetailID}
                      className="text-xs px-2 py-1 rounded border bg-white dark:bg-zinc-900 flex items-center gap-1"
                      title={`Room ${r.roomNumber ?? "—"} • ${
                        r.roomType ?? "Room"
                      }`}
                    >
                      <span className="font-medium">{r.roomNumber ?? "—"}</span>
                      <span className="opacity-70">
                        • {r.roomType ?? "Room"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {feedbackMessage && (
            <div className="mb-4 p-3 rounded-md flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span>{feedbackMessage.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Guest Name</Label>
              <Input
                value={
                  bookingDetail.bookerFullName || bookingDetail.guestName || ""
                }
                disabled
              />
            </div>
            <div>
              <Label>Room Number</Label>
              <Input value={bookingDetail.roomNumber || ""} disabled />
            </div>

            {/* Transaction Type (from API) */}
            <div>
              <Label>
                Transaction Type <span className="text-destructive">*</span>
              </Label>

              <select
                value={transactionTypeId}
                onChange={(e) => setTransactionTypeId(e.target.value)}
                disabled={tranCodeStatus === "loading" || isSubmitting}
                className="w-full h-10 rounded-md border px-3 text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="" disabled>
                  {tranCodeStatus === "loading"
                    ? "Loading..."
                    : "Select Transaction Type"}
                </option>

                {tranCodes.map((t: any) => (
                  <option key={t.transactionID} value={String(t.transactionID)}>
                    {t.tranName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="text"
                inputMode="decimal"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={applyExtras}
                onCheckedChange={(val) => setApplyExtras(!!val)}
                disabled={isSubmitting}
              />
              <Label>Apply Service Charge & Taxes</Label>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-md space-y-1 text-sm dark:bg-black dark:text-white">
            <div className="flex justify-between">
              <span>Amount (per room)</span>
              <span>
                {currencyCode} {numericAmount.toFixed(2)}
              </span>
            </div>
            {applyExtras && (
              <>
                <div className="flex justify-between">
                  <span>Service Charge (10%)</span>
                  <span>
                    {currencyCode} {computedServiceCharge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (15%)</span>
                  <span>
                    {currencyCode} {computedTax.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>TOTAL (per room)</span>
              <span>
                {currencyCode} {total}
              </span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESSING..." : "POST CREDIT / DISCOUNT"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
