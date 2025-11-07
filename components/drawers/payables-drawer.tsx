// components/drawers/payables-drawer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Banknote, CreditCard, Landmark, PenLine } from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchGlAccounts } from "@/redux/slices/glAccountSlice";
import {
  createGlTransaction,
  selectGlTxnCreateLoading,
  resetGlTransactionState,
} from "@/redux/slices/glTransactionCreateSlice";

import type { PayableItem } from "@/redux/slices/payableSlice";

/** tranType for supplier payment (adjust to your backend) */
const AP_PAYMENT_TRAN_TYPE_ID = Number(
  process.env.NEXT_PUBLIC_AP_PAYMENT_TRAN_TYPE_ID ?? 21
);

// Payment choices
const paymentMethods = [
  { label: "Cash", icon: Banknote },
  { label: "Card", icon: CreditCard },
  { label: "Online Banking", icon: Landmark },
  { label: "Cheque", icon: PenLine },
];

const round2 = (n: number) =>
  Number((Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2));

const fmtMoney = (code: string, n: number) =>
  `${code || "LKR"} ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ---- localStorage helpers ----
function lsJSON<T = any>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function getSelectedProperty() {
  return lsJSON("selectedProperty", {});
}
function getPayablesAccountId(): number {
  // Try localStorage override first, then env, else default
  try {
    const raw = localStorage.getItem("payablesAccountId");
    const env = process.env.NEXT_PUBLIC_PAYABLES_ACCOUNT_ID;
    return (
      (raw ? Number(raw) : undefined) ?? (env ? Number(env) : undefined) ?? 3 // <-- default AP account id, change if needed
    );
  } catch {
    return 3;
  }
}

/** Build a GL line */
function makeGlLine(args: {
  accountID: number;
  /** positive numbers only; we set signed amounts internally */
  debit?: number;
  credit?: number;
  memo: string;
  comment: string;
  tranDateISO: string;
  currencyCode: string;
  paymentReceiptRef?: string | null;
}) {
  const {
    accountID,
    debit = 0,
    credit = 0,
    memo,
    comment,
    tranDateISO,
    currencyCode,
    paymentReceiptRef,
  } = args;

  const nowIso = new Date().toISOString();
  const d = Number(debit) || 0;
  const c = Number(credit) || 0;

  // The signed "amount" fields in your backend lines often store DR positive, CR negative:
  const signedAmount = d > 0 ? d : -c;
  const amountSigned = round2(signedAmount);

  return {
    finAct: false,
    accountID: Number(accountID),

    amount: amountSigned,
    currAmount: amountSigned,
    amtInCurr: amountSigned,

    debit: round2(d),
    credit: round2(c),
    currDebit: round2(d),
    currCredit: round2(c),

    comment,
    createdOn: nowIso,
    createdBy: "web",
    tranTypeID: AP_PAYMENT_TRAN_TYPE_ID,
    refAccountID: 0,
    itemID: 0,
    siteID: 0,
    memo,
    tranDate: tranDateISO,
    dueDate: tranDateISO,
    chequeDate: nowIso,
    chequePrinted: false,
    paymentVoucherNo: "",
    offSetAccID: 0,
    chequeNo: "",
    supplierInvoNo: "",
    taxCode: "",
    costCenterID: 0,
    billRef: "",
    paymentReceiptRef: paymentReceiptRef ?? "",
    reconciled: 0,
    recDate: nowIso,
    propertyID: 0,
    recMasID: 0,
    batchID: 0,
    active: true,
    collectionScheduledOn: nowIso,
    isDue: false,
    isArrears: false,
    isEarlySettlement: false,
    batchNo: 0,
    split: "",
    narration: comment,
    effectiveDate: nowIso,
    currencyCode,
    tranDetailID: 0,
    pumpID: 0,
    currCode: currencyCode,
    convRate: "1",
    cardType: "",
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  payable: PayableItem | null;
  onComplete?: (payload?: any) => void;
};

export function PayablesDrawer({ open, onClose, payable, onComplete }: Props) {
  const dispatch = useAppDispatch();

  const posting = useAppSelector(selectGlTxnCreateLoading);
  const glAccounts = useAppSelector((s) => s.glAccount.list) ?? [];

  const [method, setMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [hotelCurrency, setHotelCurrency] = useState<string>("LKR");
  const [hotelCode, setHotelCode] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");

  const [payablesAccountId, setPayablesAccountId] = useState<number>(3);
  const [settlementAccountId, setSettlementAccountId] = useState<string>("");

  // Reset each open
  useEffect(() => {
    if (!open) return;
    const outstanding =
      (payable?.balance ?? 0) > 0
        ? payable?.balance!
        : (payable?.tranValue ?? 0) - (payable?.paid ?? 0);
    setAmount(outstanding ? String(round2(outstanding)) : "");
    setMethod("");
    setSettlementAccountId("");
    dispatch(resetGlTransactionState());
  }, [open, payable, dispatch]);

  // property/currency
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = getSelectedProperty();
    setHotelCurrency(p?.currencyCode || p?.currency || "LKR");
    setHotelCode(p?.hotelCode || p?.code || p?.hotelcode || "");
    setPropertyId(String(p?.id || ""));
    setPayablesAccountId(getPayablesAccountId());
  }, []);

  // load GL accounts
  useEffect(() => {
    dispatch(fetchGlAccounts());
  }, [dispatch]);

  // Cash/Bank accounts for settlement
  const settlementAccounts = useMemo(
    () =>
      (Array.isArray(glAccounts) ? glAccounts : []).filter(
        (acc: any) =>
          (acc.hotelID === propertyId || acc.hotelID === "0") &&
          acc.accountTypeID === 1 && // Cash/Bank
          acc.finAct === false
      ),
    [glAccounts, propertyId]
  );

  const canSubmit = !!payable && !!method && !!amount && !!settlementAccountId;

  const handleConfirm = async () => {
    if (!canSubmit || !payable) return;

    const base = Number(amount);
    if (!isFinite(base) || base <= 0) {
      toast.error("Enter a valid amount > 0");
      return;
    }
    if (!hotelCode) {
      toast.error("Missing hotel code.");
      return;
    }

    // AP Payment (to supplier):
    // DR Accounts Payable (reduce liability)
    // CR Settlement account (cash/bank)
    const nowIso = new Date().toISOString();
    const tranIso = nowIso;
    const curr = payable.currencyCode || hotelCurrency || "LKR";

    const drAP = makeGlLine({
      accountID: Number(payablesAccountId),
      debit: round2(base),
      memo: `AP Payment • ${payable.docNo ?? payable.refInvNo ?? ""}`,
      comment: `${method} payment to ${
        payable.name ?? payable.code ?? "Supplier"
      }`,
      tranDateISO: tranIso,
      currencyCode: curr,
      paymentReceiptRef: payable.paymentReceiptRef ?? null,
    });

    const crSettle = makeGlLine({
      accountID: Number(settlementAccountId),
      credit: round2(base),
      memo: `Settlement • ${payable.docNo ?? payable.refInvNo ?? ""}`,
      comment: `${method} settlement`,
      tranDateISO: tranIso,
      currencyCode: curr,
      paymentReceiptRef: payable.paymentReceiptRef ?? null,
    });

    const glAccTransactions = [drAP, crSettle];

    const payload = {
      glAccTransactions,
      finAct: false,
      hotelCode: String(hotelCode || ""),
      tranTypeId: AP_PAYMENT_TRAN_TYPE_ID,
      tranDate: tranIso,
      createdOn: nowIso,
      createdBy: "web",
      posted: true,
      postedOn: nowIso,
      postedBy: 0,
      tranValue: round2(base),
      currencyCode: curr,
      isTaxInclusive: true,
      status: "OK",
      remarks: `Supplier payment for ${
        payable.name ?? payable.code ?? "Supplier"
      }`,
      paymentMethod: method,
      refNo:
        payable.docNo ?? payable.refInvNo ?? payable.paymentReceiptRef ?? "",
      currTranValue: round2(base),
      currConvRate: 1,
      exchangeRate: 1,
      isFinished: true,
      isPosted: true,
      effectiveDate: nowIso,
      grossTotal: round2(base),
    };

    try {
      await dispatch(createGlTransaction(payload) as any).unwrap();
      toast.success("Payment recorded.");
      onComplete?.({
        posted: true,
        refNo: payload.refNo,
        amount: round2(base),
        method,
      });
      onClose();
    } catch (e: any) {
      const msg =
        e?.detail ||
        e?.message ||
        (typeof e === "string" ? e : "Failed to record payment.");
      toast.error(msg);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Record Payable Payment</SheetTitle>
        </SheetHeader>

        <ScrollArea className="p-4">
          {/* Summary */}
          <div className="mb-3 border rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-muted-foreground">Supplier</div>
                <div className="font-medium">
                  {payable?.name || payable?.code || "-"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Outstanding</div>
                <div className="font-semibold">
                  {fmtMoney(
                    payable?.currencyCode || hotelCurrency,
                    (payable?.balance ?? 0) > 0
                      ? payable?.balance!
                      : (payable?.tranValue ?? 0) - (payable?.paid ?? 0)
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Invoice #</div>
                <div className="text-sm">
                  {payable?.docNo ?? payable?.refInvNo ?? "-"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Tran Date</div>
                <div className="text-sm">
                  {payable?.tranDate
                    ? new Date(payable.tranDate).toLocaleDateString()
                    : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-4">
              {paymentMethods.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setMethod(label)}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-lg border hover:bg-muted transition text-left",
                    method === label ? "border-primary bg-muted" : "border"
                  )}
                >
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-base font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Amount"
                  className="h-9 w-48 text-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="h-9 min-w-[170px] rounded-lg border px-3 text-sm flex items-center">
                  {payable?.currencyCode || hotelCurrency}
                </div>
              </div>
            </div>

            {/* CR Settlement account */}
            {method && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Settlement Account
                </label>
                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={settlementAccountId}
                  onChange={(e) => setSettlementAccountId(e.target.value)}
                >
                  <option value="">Select account</option>
                  {settlementAccounts.map((acc: any) => (
                    <option key={acc.accountID} value={acc.accountID}>
                      {acc.accountName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2">
              <Button
                className="w-full"
                disabled={!canSubmit || posting}
                onClick={handleConfirm}
              >
                {posting ? "POSTING..." : "CONFIRM PAYMENT"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
