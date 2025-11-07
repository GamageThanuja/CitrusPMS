// eslint-disable-next-line @typescript-eslint/ban-ts-comment
"use client";

import { useState, useEffect } from "react";
import { getReasons } from "@/controllers/reasonsMasterController";
import { ReasonMasterPayload } from "@/types/reasonsMaster";
import { Button } from "@/components/ui/button";
import { getAllCurrencies } from "@/controllers/AllCurrenciesController";

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

interface NoShowDrawerProps {
  bookingDetail: {
    reservationNo?: string;
    reservationDetailID?: number;
    guestName?: string;
  };
  onClose: () => void;
  isOpen?: boolean;
  isLoading?: boolean;
  /**
   * Will receive user's choices. Parent can ignore the argument if not needed.
   */
  onConfirm: (args?: {
    detailIds?: number[];
    reason: string;
    withSurcharges: boolean;
    amount?: number;
    currency?: string;
  }) => void;

  /** Needed to pop the payments drawer when surcharges are selected */
  setTakePaymentsOpen: (open: boolean) => void;

  /** Provided by parent when invoked via "Group Action" */
  groupContext?: GroupContext;
}

export interface Currency {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
}

export function NoShowDrawer({
  bookingDetail,
  onClose,
  isLoading = false,
  onConfirm,
  setTakePaymentsOpen,
  groupContext,
}: NoShowDrawerProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [withSurcharges, setWithSurcharges] = useState<boolean>(false);
  const [reasonOptions, setReasonOptions] = useState<ReasonMasterPayload[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // NEW: Apply-to-all toggle for group
  const [applyToAllSelected, setApplyToAllSelected] = useState<boolean>(true);

  // Fetch "No-Show" reasons + currencies (single effect)
  useEffect(() => {
    const fetchReasonsAndCurrencies = async () => {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      if (!accessToken) return;

      try {
        const reasonsData = await getReasons({ token: accessToken });
        const filtered = (reasonsData || []).filter(
          (item: ReasonMasterPayload) => item.category === "No-Show"
        );
        setReasonOptions(filtered);
      } catch (error) {
        console.error("Failed to fetch reasons", error);
      }

      try {
        const currencies = await getAllCurrencies();
        setCurrencyOptions(currencies || []);
      } catch (error) {
        console.error("Failed to fetch currencies", error);
      }
    };

    fetchReasonsAndCurrencies();
  }, []);

  const selectedCount = groupContext?.selectedRooms?.length ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) return;

    // Validate surcharge input if enabled
    if (withSurcharges) {
      const value = parseFloat(amount);
      if (Number.isNaN(value) || value <= 0) {
        alert("Please enter a valid surcharge amount.");
        return;
      }
      if (!selectedCurrency) {
        alert("Please select a currency for the surcharge.");
        return;
      }
    }

    const payload = {
      detailIds:
        groupContext?.isGroup && applyToAllSelected
          ? groupContext.detailIds
          : undefined,
      reason: selectedReason,
      withSurcharges,
      amount: withSurcharges ? parseFloat(amount) : undefined,
      currency: withSurcharges ? selectedCurrency : undefined,
    };

    // Let parent handle single or bulk flow
    onConfirm(payload);

    // Open payments flow only if surcharges are requested
    if (withSurcharges) {
      setTakePaymentsOpen(true);
    }

    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b ">
        <h2 className="text-lg font-medium">Mark as No Show</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-4">
          {/* Group banner */}
          {groupContext?.isGroup && selectedCount > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    Group no-show • {selectedCount} room
                    {selectedCount > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs opacity-80">
                    The reason and surcharges (if any) will be applied to all
                    selected rooms when enabled.
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
              <div className="max-h-24 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {groupContext.selectedRooms!.map((r) => (
                  <div
                    key={r.reservationDetailID}
                    className="text-xs px-2 py-1 rounded border bg-white dark:bg-zinc-900 flex items-center gap-1"
                    title={`Room ${r.roomNumber ?? "—"} • ${
                      r.roomType ?? "Room"
                    }`}
                  >
                    <span className="font-medium">{r.roomNumber ?? "—"}</span>
                    <span className="opacity-70">• {r.roomType ?? "Room"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic info */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-white">
              Reservation No:{" "}
              <span className="font-medium">
                {bookingDetail?.reservationNo || "—"}
              </span>
            </p>
          </div>

          {/* Form block */}
          <div className="space-y-4 ">
            <div className="bg-gray-50 dark:bg-black dark:text-white p-4 rounded-md">
              <p className="text-sm text-gray-700 dark:text-white mb-3">
                Are you sure this guest didn't arrive?
              </p>

              {/* Reason */}
              <div className="space-y-2">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
                >
                  Reason for No Show
                </label>
                <select
                  id="reason"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason</option>
                  {reasonOptions.map((reason) => (
                    <option key={reason.reasonId} value={reason.reason}>
                      {reason.reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Surcharges */}
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="withSurcharges"
                  checked={withSurcharges}
                  onChange={(e) => setWithSurcharges(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="withSurcharges"
                  className="ml-2 block text-sm text-gray-700 dark:text-white"
                >
                  No show with surcharges
                </label>
              </div>

              {withSurcharges && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Amount Charged
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="col-span-3 p-2 border border-gray-300 rounded-md"
                      placeholder="Enter amount"
                    />
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="col-span-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Currency</option>
                      {currencyOptions.map((cur) => (
                        <option key={cur.currencyId} value={cur.currencyCode}>
                          {cur.currencyCode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading}
              className="px-4 py-2 text-sm"
            >
              {isLoading ? "Processing..." : "Mark as No Show"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
