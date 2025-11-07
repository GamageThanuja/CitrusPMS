// components/drawers/receivables-drawer.tsx
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
import { fetchCityLedger } from "@/redux/slices/cityLedgerSlice";
import {
  createGlTransaction,
  selectGlTxnCreateLoading,
  resetGlTransactionState,
} from "@/redux/slices/glTransactionCreateSlice";

export type ReceivablesRow = {
  id: string;
  supplier: string;
  issueDate?: string | null;
  dueDate?: string | null;
  amount: number;
  status: "Paid" | "Pending" | "Credit";
  reservationNo?: string;
  paymentReceiptRef?: string;
};

type PayableDrawerProps = {
  open: boolean;
  onClose: () => void;
  payable?: ReceivablesRow | null;
  onComplete?: (payload?: any) => void;
};

/** your tranType for city-ledger receipt */
const CL_RECEIPT_TRAN_TYPE_ID = 17;

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
function getCityLedgerAccountId(): number {
  try {
    const rawCl = localStorage.getItem("cityLedgerAccountId");
    const envCl = process.env.NEXT_PUBLIC_CITY_LEDGER_ACCOUNT_ID;
    return (
      (rawCl ? Number(rawCl) : undefined) ??
      (envCl ? Number(envCl) : undefined) ??
      1
    );
  } catch {
    return 1;
  }
}

function makeGlLine(args: {
  accountID: number;
  debit?: number;
  credit?: number;
  memo: string;
  comment: string;
  tranDateISO: string;
  currencyCode: string;
  paymentReceiptRef: string;
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
  const isCredit = c > 0 && d === 0;
  const signedAmount = isCredit ? -c : d;
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
    tranTypeID: CL_RECEIPT_TRAN_TYPE_ID,
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
    paymentReceiptRef: paymentReceiptRef,
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

export function ReceivablesDrawer({
  open,
  onClose,
  payable,
  onComplete,
}: PayableDrawerProps) {
  console.log("payable : ", payable);
  const dispatch = useAppDispatch();

  const posting = useAppSelector(selectGlTxnCreateLoading);
  const glAccounts = useAppSelector((s) => s.glAccount.list) ?? [];

  const [method, setMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("LKR");
  const [postingLocal, setPostingLocal] = useState(false);

  const [hotelCurrency, setHotelCurrency] = useState<string>("LKR");
  const [hotelCode, setHotelCode] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");

  const [cityLedgerAccountId, setCityLedgerAccountId] = useState<number>(1);
  const [selectedAccountID, setSelectedAccountID] = useState<string>("");

  // reset UI each open
  useEffect(() => {
    if (!open) return;
    setAmount(payable?.amount != null ? Number(payable.amount).toFixed(2) : "");
    setMethod("");
    setPostingLocal(false);
    dispatch(resetGlTransactionState());
  }, [open, payable, dispatch]);

  // property + currency
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = getSelectedProperty();
    setHotelCurrency(p?.currencyCode || p?.currency || "LKR");
    setCurrency(p?.currencyCode || p?.currency || "LKR");
    setHotelCode(p?.hotelCode || p?.code || p?.hotelcode || "");
    setPropertyId(String(p?.id || ""));
    setCityLedgerAccountId(getCityLedgerAccountId());
  }, []);

  // load GL accounts
  useEffect(() => {
    dispatch(fetchGlAccounts());
  }, [dispatch]);

  const filteredAccounts = useMemo(
    () =>
      (Array.isArray(glAccounts) ? glAccounts : []).filter(
        (acc: any) =>
          (acc.hotelID === propertyId || acc.hotelID === "0") &&
          acc.accountTypeID === 1 && // Cash/Bank
          acc.finAct === false
      ),
    [glAccounts, propertyId]
  );

  const canSubmit =
    !!payable && !!method && !!amount && !!currency && !!selectedAccountID;

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

    // Build GL lines: DR settlement (amount entered), CR city ledger (same)
    const nowIso = new Date().toISOString();
    const tranIso = nowIso;

    const drLine = makeGlLine({
      accountID: Number(selectedAccountID),
      debit: round2(base),
      memo: `Receipt • ${payable.id}`,
      comment: `${method} receipt`,
      tranDateISO: tranIso,
      currencyCode: currency,
      paymentReceiptRef: payable.paymentReceiptRef,
    });

    const crLine = makeGlLine({
      accountID: cityLedgerAccountId,
      credit: round2(base),
      memo: `CL Credit • ${
        payable.paymentReceiptRef || payable.reservationNo || payable.id
      }`,
      comment: "City Ledger settlement",
      tranDateISO: tranIso,
      currencyCode: currency,
      paymentReceiptRef: payable.paymentReceiptRef,
    });

    const glAccTransactions = [drLine, crLine];

    const payload = {
      glAccTransactions,
      finAct: false,
      hotelCode: String(hotelCode || ""),
      tranTypeId: CL_RECEIPT_TRAN_TYPE_ID,
      tranDate: tranIso,
      createdOn: nowIso,
      createdBy: "web",
      posted: true,
      postedOn: nowIso,
      postedBy: 0,
      tranValue: round2(base),
      currencyCode: currency,
      isTaxInclusive: true,
      status: "OK",
      remarks: `City Ledger receipt for ${payable.supplier}`,
      paymentMethod: method,
      refNo: payable.paymentReceiptRef || payable.reservationNo || payable.id,
      currTranValue: round2(base),
      currConvRate: 1,
      exchangeRate: 1,
      isFinished: true,
      isPosted: true,
      effectiveDate: nowIso,
      grossTotal: round2(base),
    };

    try {
      setPostingLocal(true);
      await dispatch(createGlTransaction(payload) as any).unwrap();

      console.log("payload : ", JSON.stringify(payload));

      toast.success("Receivable recorded.");
      onComplete?.({
        posted: true,
        refNo: payload.refNo,
        amount: round2(base),
        method,
      });

      dispatch(fetchCityLedger());
      onClose();
    } catch (e: any) {
      const msg =
        e?.detail ||
        e?.message ||
        (typeof e === "string" ? e : "Failed to record receivable.");
      toast.error(msg);
    } finally {
      setPostingLocal(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Record Receivable</SheetTitle>
        </SheetHeader>

        <ScrollArea className="p-4">
          {/* Summary */}
          <div className="mb-3 border rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-muted-foreground">Customer / Company</div>
                <div className="font-medium">{payable?.supplier || "-"}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Outstanding</div>
                <div className="font-semibold">
                  {fmtMoney(hotelCurrency, payable?.amount || 0)}
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Invoice Date
                </div>
                <div className="text-sm">{payable?.issueDate || "-"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Due Date</div>
                <div className="text-sm">{payable?.dueDate || "-"}</div>
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

          {/* Base amount */}
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
                  {hotelCurrency}
                </div>
              </div>
            </div>

            {/* DR Settlement account */}
            {method && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Settlement Account
                </label>
                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={selectedAccountID}
                  onChange={(e) => setSelectedAccountID(e.target.value)}
                >
                  <option value="">Select account</option>
                  {filteredAccounts.map((acc: any) => (
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
                disabled={!canSubmit || posting || postingLocal}
                onClick={handleConfirm}
              >
                {posting || postingLocal ? "POSTING..." : "CONFIRM PAYMENT"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
