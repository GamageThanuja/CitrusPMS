"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, CircleCheckBig } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchTransactionCodes } from "@/redux/slices/transactionCodeSlice";
import { fetchGlAccounts } from "@/redux/slices/glAccountSlice";
import React, { useEffect, useMemo, useState } from "react";
import { BookingDetails } from "@/types/booking";
import { toast } from "sonner";
import { createReservationCashPayout } from "@/controllers/reservationController";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useCurrency } from "@/hooks/useCurrency";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { RootState } from "@/redux/store";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { useSendHotelEmail } from "@/hooks/useSendHotelEmail";
import {
  buildCashPayoutEmail,
  CashPayoutEmailData,
} from "@/lib/email/cashPayoutEmail";
import { useToast } from "../toast/ToastProvider";

interface CashPayoutDrawerProps {
  open: boolean;
  onClose: () => void;
  booking: BookingDetails;
}

export const CashPayoutDrawer: React.FC<CashPayoutDrawerProps> = ({
  open,
  onClose,
  booking,
}) => {
  const dispatch = useAppDispatch();
  const { list: glAccounts, listLoading } = useAppSelector(
    (state) => state.glAccount
  );

  console.log("glAccounts", glAccounts);
  const { send, context } = useSendHotelEmail();

  const [selectedAccountID, setSelectedAccountID] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "error";
    message: string;
  } | null>(null);

  const { fullName } = useUserFromLocalStorage();
  const currency = useStoredCurrencyCode();
  const { show } = useToast();

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  console.log("System Date from Redux take payment:", systemDate);

  console.log("hotelCurrency", currency);

  const selectedProperty = JSON.parse(
    localStorage.getItem("selectedProperty") || "{}"
  );
  const hotelID = selectedProperty.id;

  // Filter only AccountTypeId = 1 and hotelId = current property
  const filteredAccounts = useMemo(() => {
    return glAccounts.filter(
      (acc) =>
        acc.accountTypeID === 1 &&
        (String(acc.hotelID).trim() === String(hotelID) ||
          String(acc.hotelID).trim() === "0")
    );
  }, [glAccounts, hotelID]);

  // Load GL accounts & transaction codes
  useEffect(() => {
    if (open) {
      setSelectedAccountID(null);
      setAmount("0");
      setFeedbackMessage(null);
      dispatch(fetchTransactionCodes());
      dispatch(fetchGlAccounts());
    }
  }, [open, dispatch]);

  // Set default selection (cash/bank if found)
  useEffect(() => {
    if (open && filteredAccounts.length > 0) {
      const defaultAccount =
        filteredAccounts.find((acc) =>
          ["cash", "bank"].some((k) =>
            acc.accountName.toLowerCase().includes(k)
          )
        ) || filteredAccounts[0];

      setSelectedAccountID(defaultAccount.accountID.toString());
    }
  }, [open, filteredAccounts]);

  const handlePayout = async () => {
    if (!selectedAccountID) {
      setFeedbackMessage({
        type: "error",
        message: "Please select an account type",
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

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;

      const payload = {
        reservationDetailId: booking.reservationDetailID || 0,
        reservationMasterId: booking.reservationMasterID || 0,
        nameId: booking.nameID || 0,
        hotelCode: selectedProperty.hotelCode?.toString() || "",
        accountId: Number(selectedAccountID),
        amount: parseFloat(amount),
        tranDate: systemDate,
        currencyCode: booking.currencyCode || "USD",
        conversionRate: 1,
        remarks: "Cash payout",
        tranTypeId: 40,
        exchangeRate: 1,
        createdBy: fullName || "",
        cashAccountId: Number(selectedAccountID),
      };

      // 👇 Add this
      console.log("CashPayout Payload:", JSON.stringify(payload, null, 2));

      await createReservationCashPayout({
        token: accessToken,
        payload,
      });

      const toEmail =
        (booking as any)?.email?.trim?.() ||
        (booking as any)?.guestEmail?.trim?.() ||
        ""; // keep simple; swap with your profile lookup if needed

      if (toEmail) {
        const data: CashPayoutEmailData = {
          invoiceNo: `PO-${Date.now()}`,
          paidAmount: Number(amount || 0),
          paidCurrency: booking.currencyCode || context.hotelCurrency || "LKR",
          paidMethod: "Cash",
          paidDateISO: (systemDate as any) || context.systemDateISO,
          forLine: `cash payout for ${
            booking?.guestName || booking?.guest || "Guest"
          }${booking?.roomNumber ? ` (Room ${booking.roomNumber})` : ""}`,
          paidStampUrl:
            "https://hotelmate-internal.s3.us-east-1.amazonaws.com/CashPayOut.png",
        };

        await send({
          toEmail,
          subject: `Cash Payout Receipt – ${context.companyName} – ${data.invoiceNo}`,
          buildHtml: buildCashPayoutEmail,
          templateData: data,
        });
      } else {
        console.warn("CashPayout: no guest email; skipping receipt send");
      }

      show({
        variant: "success",
        title: "Recorded successfully!",
        description: "Cash payout processed successfully!",
      });

      onClose();
    } catch (error) {
      console.error("Payout error:", error);
      setFeedbackMessage({
        type: "error",
        message: "Failed to process cash payout",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Cash Payout</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-[10px] p-4">
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
                value={booking?.guestName || booking?.guest || ""}
                disabled
              />
            </div>
            <div>
              <Label>Room Number</Label>
              <Input value={booking?.roomNumber || ""} disabled />
            </div>

            <div>
              <Label>
                Account <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedAccountID ?? ""}
                onValueChange={(value) => setSelectedAccountID(value)}
                disabled={isSubmitting || listLoading}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select Account Type" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAccounts.map((account) => (
                    <SelectItem
                      key={account.accountID}
                      value={account.accountID.toString()}
                    >
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  className="col-span-3"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
                <div className="col-span-1 flex items-center justify-center border rounded-md bg-muted text-sm text-muted-foreground h-10">
                  {currency || "---"}
                </div>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handlePayout}
            disabled={isSubmitting}
          >
            {isSubmitting ? "PROCESSING..." : "PROCESS PAYOUT"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
