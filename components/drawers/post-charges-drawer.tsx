"use client";

import { useState, useMemo, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchTransactionCode } from "@/redux/slices/fetchTransactionCodeSlice";
import { fetchHotelTaxByHotelId } from "@/redux/slices/fetchHotelTaxByHotelIdSlice";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { CircleCheckBig, AlertCircle } from "lucide-react";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { useCurrency } from "@/hooks/useCurrency";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import {
  fetchHotelTaxConfigs,
  selectHotelTaxConfigs,
} from "@/redux/slices/hotelTaxConfigSlice";
import {
  createTransaction,
  selectCreateTransactionLoading,
  resetCreateTransactionState,
} from "@/redux/slices/createTransactionSlice";

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

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  bookingDetail: any;
  groupContext?: GroupContext;
}

/** 🔧 Configure to your environment */
const GUEST_LEDGER_ACCOUNT_ID = 2; // Guest/Folio control account
const POST_CHARGES_TRAN_TYPE_ID = 2; // Confirm with your API/tenant

export function PostChargesDrawer({
  open,
  onClose,
  bookingDetail,
  groupContext,
}: DrawerProps) {
  const [hotelCode, setHotelCode] = useState("");
  const [hotelId, setHotelId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "error";
    message: string;
  } | null>(null);
  const [applyToAllSelected, setApplyToAllSelected] = useState(true);

  const dispatch = useAppDispatch();

  const { data: tranCodes } = useAppSelector(
    (state) => state.fetchTransactionCode || { data: [] }
  );
  const posting = useAppSelector(selectCreateTransactionLoading);

  const [selectedTran, setSelectedTran] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [applyExtras, setApplyExtras] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyCode = useStoredCurrencyCode();
  useCurrency(); // keep warm

  console.log("[PostChargesDrawer] bookingDetail:", bookingDetail);

  // Reset UI when open
  useEffect(() => {
    if (open) {
      setSelectedTran(null);
      setAmount("");
      setFeedbackMessage(null);
      setApplyToAllSelected(true);
      dispatch(resetCreateTransactionState());
    }
  }, [open, dispatch]);

  // property info
  useEffect(() => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    setHotelCode(property?.hotelCode || "");
    setHotelId(typeof property?.id === "number" ? property.id : null);
  }, []);

  // configs / codes
  useEffect(() => {
    if (hotelId) dispatch(fetchHotelTaxConfigs());
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (hotelId) dispatch(fetchHotelTaxByHotelId(hotelId));
  }, [dispatch, hotelId]);

  const hotelRows = useSelector(selectHotelTaxConfigs);

  useEffect(() => {
    dispatch(fetchTransactionCode());
  }, [dispatch]);

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );
  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  // ---------------- TAX LADDER (DYNAMIC) ----------------
  type TaxRow = {
    recordId: number;
    hotelId: number;
    taxName: string; // ANY label e.g., "SERVICE CHARGE", "CITY TAX", "GST", "VAT"
    percentage: number;
    calcBasedOn: "Base" | `Subtotal${number}` | string;
    accountId?: number | null;
  };

  const rows = (hotelRows ?? []) as TaxRow[];

  const trim = (s: any) => (typeof s === "string" ? s.trim() : s ?? "");
  const normBase = (v?: string | null): "Base" | `Subtotal${number}` => {
    const raw = trim(v).toUpperCase().replace(/\s+/g, "");
    if (!raw || raw.startsWith("BASE")) return "Base";
    const m = raw.match(/SUBTOTAL(\d+)/);
    if (m?.[1]) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n >= 1) return `Subtotal${n}`;
    }
    return "Base";
  };
  const baseLevel = (b: string) =>
    String(b).toUpperCase().startsWith("SUBTOTAL")
      ? parseInt(String(b).replace(/[^0-9]/g, "") || "0", 10)
      : 0;

  // Normalize + sort taxes by level then by name
  const normTaxes = useMemo(() => {
    const mapped = rows
      .map((r) => ({
        name: trim(r.taxName),
        pct: Number.isFinite(r.percentage) ? r.percentage : 0,
        base: normBase(r.calcBasedOn),
        level: baseLevel(r.calcBasedOn),
        accountId: r.accountId ?? null,
      }))
      .filter((t) => !!t.name);

    return mapped.sort((a, b) => {
      const lv = a.level - b.level;
      if (lv !== 0) return lv;
      return a.name.localeCompare(b.name);
    });
  }, [rows]);

  const base = parseFloat(amount) > 0 ? parseFloat(amount) : 0;

  type CalcLine = {
    level: number;
    name: string;
    pct: number;
    taxAmount: number;
    accountId: number | null;
  };
  type CalcResult = {
    base: number;
    lines: CalcLine[];
    subtotals: Record<number, number>;
    grandTotal: number;
  };

  // >>> dynamic: compute ladder generically
  const calc = useMemo<CalcResult>(() => {
    const r2 = (n: number) =>
      Number((Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2));

    // group taxes by level
    const byLevel = new Map<number, typeof normTaxes>();
    normTaxes.forEach((t) => {
      if (!byLevel.has(t.level)) byLevel.set(t.level, []);
      byLevel.get(t.level)!.push(t);
    });
    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);

    let currentBase = base;
    const lines: CalcLine[] = [];
    const subtotals: Record<number, number> = {};

    if (!applyExtras || normTaxes.length === 0) {
      // no extras → grand is just base
      return { base, lines: [], subtotals: {}, grandTotal: r2(base) };
    }

    for (const lvl of levels) {
      const taxes = byLevel.get(lvl)!;
      let sumAtLevel = 0;
      for (const t of taxes) {
        const amt = (currentBase * (Number(t.pct) || 0)) / 100;
        const val = r2(amt);
        sumAtLevel += val;
        lines.push({
          level: lvl,
          name: t.name,
          pct: Number(t.pct) || 0,
          taxAmount: val,
          accountId: t.accountId ?? null,
        });
      }
      currentBase = r2(currentBase + sumAtLevel);
      subtotals[lvl] = currentBase;
    }

    return { base, lines, subtotals, grandTotal: currentBase };
  }, [base, normTaxes, applyExtras]);

  // Small helpers
  const round2 = (n: number) =>
    Number((Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2));
  const isoAtMidnight = (d?: string) => {
    if (!d) return new Date().toISOString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d))
      return new Date(`${d}T00:00:00`).toISOString();
    return d;
  };
  const yyyymmdd = (dt: Date) =>
    `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(
      dt.getDate()
    ).padStart(2, "0")}`;
  const fmtApiErr = (e: any) =>
    e?.detail ||
    e?.message ||
    e?.title ||
    (typeof e === "string" ? e : JSON.stringify(e)) ||
    "Unknown error";

  // ---------- BUILD GL LINE ----------
  type MakeLineParams = {
    accountID: number;
    debit?: number;
    credit?: number;
    memo: string;
    comment: string;
    tranDateISO: string;
    taxCode?: string;
    narration?: string;
    reservationDetailID: number;
  };

  const makeGlLine = ({
    accountID,
    debit = 0,
    credit = 0,
    memo,
    comment,
    tranDateISO,
    taxCode = "",
    narration = "",
    reservationDetailID,
  }: MakeLineParams) => {
    const nowIso = new Date().toISOString();
    const debitVal = Number.isFinite(debit) ? Number(debit) : 0;
    const creditVal = Number.isFinite(credit) ? Number(credit) : 0;
    const isCredit = creditVal > 0 && debitVal === 0;
    const signedAmount = isCredit ? -creditVal : debitVal;
    const amountSigned = round2(signedAmount);

    return {
      finAct: false,
      accountID: Number(accountID),

      amount: amountSigned,
      currAmount: amountSigned,
      amtInCurr: amountSigned,

      debit: round2(debitVal),
      credit: round2(creditVal),
      currDebit: round2(debitVal),
      currCredit: round2(creditVal),

      comment,
      createdOn: nowIso,
      createdBy: bookingDetail?.createdBy || "System",
      tranTypeID: POST_CHARGES_TRAN_TYPE_ID,
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
      taxCode,
      costCenterID: 0,
      billRef: "",
      paymentReceiptRef: "",
      reconciled: 0,
      recDate: nowIso,
      propertyID: hotelId ?? 0,
      recMasID: 0,
      batchID: 0,
      active: true,
      collectionScheduledOn: nowIso,
      isDue: false,
      isArrears: false,
      isEarlySettlement: false,
      batchNo: 0,
      split: "",
      narration,
      effectiveDate: nowIso,
      currencyCode,
      tranDetailID: 0,
      pumpID: 0,
      currCode: currencyCode,
      convRate: "1",
      cardType: "",
      reservationDetailID: Number(reservationDetailID),
    };
  };

  // ---------------- BUILD FULL PAYLOAD (DYNAMIC) ----------------
  const makeGlPayloadForDetail = (
    reservationDetailId: number,
    revenueAccountId: number
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const tranIso = isoAtMidnight(systemDate) || nowIso;

    const guest = (
      bookingDetail?.guestName ||
      bookingDetail?.guest ||
      ""
    ).trim();
    const room = bookingDetail?.roomNumber || "—";
    const safeDocNo = `CHG-${
      hotelCode || "HTL"
    }-${reservationDetailId}-${yyyymmdd(now)}`;

    // CREDIT: Revenue on entered base amount
    const creditLines: any[] = [];
    creditLines.push(
      makeGlLine({
        accountID: Number(revenueAccountId),
        credit: round2(base),
        memo: `Revenue • RD:${reservationDetailId} • Room:${room} • ${guest} `,
        comment: "Post Charges (Revenue)",
        tranDateISO: tranIso,
        reservationDetailID: reservationDetailId,
      })
    );

    // CREDIT: dynamic tax lines
    if (applyExtras && calc.lines.length) {
      for (const ln of calc.lines) {
        if (ln.taxAmount > 0 && ln.accountId) {
          const codeGuess =
            ln.name
              .toUpperCase()
              .replace(/[^A-Z]/g, "")
              .slice(0, 6) || "TAX";
          creditLines.push(
            makeGlLine({
              accountID: Number(ln.accountId),
              credit: round2(ln.taxAmount),
              memo: `${ln.name} • RD:${reservationDetailId} • Room:${room} • ${guest} `,
              comment: `Post Charges (${ln.name})`,
              tranDateISO: tranIso,
              taxCode: codeGuess,
              narration: ln.name,
              reservationDetailID: reservationDetailId,
            })
          );
        }
      }
    }

    const sumCredits = round2(
      creditLines.reduce((s, l) => s + (l.credit ?? 0), 0)
    );

    // DEBIT: Guest/Folio for sum of credits
    const debitLine = makeGlLine({
      accountID: Number(GUEST_LEDGER_ACCOUNT_ID),
      debit: sumCredits,
      memo: `Guest Ledger • RD:${reservationDetailId} • Room:${room} • ${guest} `,
      comment: "Post Charges (Guest Ledger)",
      tranDateISO: tranIso,
      reservationDetailID: reservationDetailId,
    });

    const glAccTransactions = [debitLine, ...creditLines];

    // Pull VAT value if a line is called VAT (optional)
    const vatLine =
      calc.lines.find((l) => l.name.trim().toUpperCase() === "VAT") || null;

    return {
      glAccTransactions,
      finAct: false,
      hotelCode: String(hotelCode || ""),
      tranTypeId: POST_CHARGES_TRAN_TYPE_ID,
      tranDate: tranIso,
      createdOn: nowIso,
      createdBy: bookingDetail?.createdBy || "System",
      posted: false,
      tranValue: sumCredits,
      vatValue: round2(vatLine?.taxAmount ?? 0),
      currencyCode,
      isTaxInclusive: true,
      status: "Active",
      remarks: `Post Charges • RD:${reservationDetailId} • Room:${room} • ${guest} `,
      dueDate: tranIso,
      refNo: safeDocNo,
      refInvNo: "",
      isGuestLedger: true,
      effectiveDate: nowIso,
      reservationDetailId: Number(reservationDetailId),
      reservationId: Number(bookingDetail?.reservationID ?? 0),
      // If your backend wants a breakdown, consider adding:
      // taxBreakdown: calc.lines.map(l => ({ name: l.name, pct: l.pct, amount: round2(l.taxAmount), level: l.level })),
      grossTotal: round2(calc.grandTotal),
    };
  };

  // ---------------- SUBMIT ----------------
  const onPostCharges = async () => {
    // Basic validations
    if (!selectedTran)
      return setFeedbackMessage({
        type: "error",
        message: "Please select a transaction type.",
      });
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      return setFeedbackMessage({
        type: "error",
        message: "Please enter a valid amount.",
      });
    if (!hotelCode)
      return setFeedbackMessage({
        type: "error",
        message: "Hotel code not found.",
      });
    if (!hotelId)
      return setFeedbackMessage({
        type: "error",
        message: "Property (hotel) not selected.",
      });
    if (
      !GUEST_LEDGER_ACCOUNT_ID ||
      Number.isNaN(Number(GUEST_LEDGER_ACCOUNT_ID))
    )
      return setFeedbackMessage({
        type: "error",
        message: "Guest Ledger account not configured.",
      });

    const targetIds =
      groupContext?.isGroup && applyToAllSelected
        ? groupContext.detailIds ?? []
        : bookingDetail?.reservationDetailID
        ? [bookingDetail.reservationDetailID]
        : [];

    if (!targetIds.length)
      return setFeedbackMessage({
        type: "error",
        message: "No rooms selected.",
      });

    const selectedTransaction = tranCodes.find(
      (t) => t.transactionID === parseInt(selectedTran)
    );
    if (!selectedTransaction)
      return toast.error("Invalid transaction type selected.");

    const revenueAccountID = selectedTransaction.accountID;
    if (!revenueAccountID)
      return toast.error("The selected transaction has no revenue account ID.");

    const userIdStr =
      typeof window !== "undefined" ? localStorage.getItem("userID") : null;

    const userId = userIdStr ? Number(userIdStr) : 0;

    setIsSubmitting(true);
    setFeedbackMessage(null);
    dispatch(resetCreateTransactionState());

    try {
      const runs = targetIds.map(async (rdId) => {
        const payload = makeGlPayloadForDetail(rdId, revenueAccountID);
        console.log("[GL][SEND] RD:", rdId, JSON.stringify(payload, null, 2));
        try {
          const res = await dispatch(
            createTransaction({
              userId,
              transaction: payload,
            })
          ).unwrap();
          console.log("[GL][OK] RD:", rdId, res);
          return { rdId, ok: true as const, res };
        } catch (err: any) {
          console.error("[GL][ERR] RD:", rdId, err);
          return { rdId, ok: false as const, err };
        }
      });

      const results = await Promise.all(runs);
      const ok = results.filter((r) => r.ok).length;
      const bad = results.length - ok;

      if (ok) {
        toast.custom(
          () => (
            <div className="bg-background border border-border rounded-lg p-4 flex items-center gap-3">
              <CircleCheckBig className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-medium">
                  Posted GL for {ok} room{ok > 1 ? "s" : ""}.
                </h3>
              </div>
            </div>
          ),
          { duration: 2500 }
        );
      }
      if (bad) {
        const firstErr = results.find((r) => !r.ok)?.err;
        toast.error(`Failed for ${bad}: ${fmtApiErr(firstErr)}`);
      }

      setAmount("");
      setSelectedTran(null);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error("createGlTransaction unexpected error:", err);
      toast.error(`Failed to post charges: ${fmtApiErr(err)}`);
      setIsSubmitting(false);
    }
  };

  const selectedCount = groupContext?.selectedRooms?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="z-[120] w-full sm:max-w-2xl h-full overflow-hidden rounded-l-2xl bg-white text-gray-900 dark:bg-neutral-900 dark:text-white"
      >
        <div className="space-y-6 px-[10px] p-4">
          <h2 className="text-xl font-semibold">Post Charges</h2>

          {/* Group banner */}
          {groupContext?.isGroup && selectedCount > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    Group post • {selectedCount} room
                    {selectedCount > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs opacity-80">
                    The same transaction and amount will be posted to all
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

          {feedbackMessage && (
            <div className="mb-4 p-3 rounded-md flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span>{feedbackMessage.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Guest Name</Label>
              <Input value={(bookingDetail?.bookerFullName).trim()} disabled />
            </div>
            <div>
              <Label>Room Number</Label>
              <Input value={bookingDetail?.roomNumber || ""} disabled />
            </div>
            <div>
              <Label>
                Transaction Type <span className="text-destructive">*</span>
              </Label>
              <TransactionSelect
                value={selectedTran ?? ""}
                onChange={(v) => setSelectedTran(v)}
              />
            </div>
            <div>
              <Label>
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="text"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-1 text-right text-sm text-muted-foreground">
                  {currencyCode}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={applyExtras}
                onCheckedChange={(val) => setApplyExtras(!!val)}
                disabled={isSubmitting}
              />
              <Label>Apply Service Charge & Taxes</Label>
            </div>

            {/* >>> dynamic: Calculation ladder */}
            <div className="bg-gray-100 p-4 dark:bg-black dark:text-white rounded-md space-y-1 text-sm">
              <GridRow label="Base" value={base} code={currencyCode} />

              {applyExtras && normTaxes.length > 0 && (
                <>
                  {(() => {
                    // render grouped by level, with a subtotal after each level
                    const byLvl: Record<number, CalcLine[]> = {};
                    calc.lines.forEach((ln) => {
                      if (!byLvl[ln.level]) byLvl[ln.level] = [];
                      byLvl[ln.level].push(ln);
                    });
                    const lvls = Object.keys(byLvl)
                      .map((n) => Number(n))
                      .sort((a, b) => a - b);

                    const blocks: JSX.Element[] = [];
                    lvls.forEach((lvl, idx) => {
                      byLvl[lvl].forEach((ln) => {
                        blocks.push(
                          <GridRow
                            key={`tax-${lvl}-${ln.name}`}
                            label={`${ln.name} (${ln.pct}%)`}
                            value={ln.taxAmount}
                            code={currencyCode}
                          />
                        );
                      });
                      blocks.push(
                        <GridRow
                          key={`st-${lvl}`}
                          label={`SUB TOTAL ${lvl + 1}`}
                          value={calc.subtotals[lvl] ?? 0}
                          code={currencyCode}
                          bold
                          dividerTop
                        />
                      );
                    });
                    return blocks;
                  })()}
                </>
              )}

              <GridRow
                label="Grand Total"
                value={calc.grandTotal}
                code={currencyCode}
                bold
                dividerTop
                big
              />
            </div>

            <Button
              onClick={onPostCharges}
              className="w-full"
              disabled={isSubmitting || posting}
            >
              {isSubmitting || posting ? "PROCESSING..." : "POST CHARGES"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TransactionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data } = useAppSelector(
    (s) => s.fetchTransactionCode || { data: [] }
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="" disabled>
        Select Transaction Type
      </option>
      {data.map((transaction) => (
        <option
          key={transaction.transactionID}
          value={transaction.transactionID}
        >
          {transaction.tranName}
        </option>
      ))}
    </select>
  );
}

function GridRow({
  label,
  value,
  code,
  bold = false,
  dividerTop = false,
  big = false,
}: {
  label: string;
  value: number;
  code: string;
  bold?: boolean;
  dividerTop?: boolean;
  big?: boolean;
}) {
  return (
    <div
      className={[
        "grid grid-cols-4 py-0.5",
        dividerTop
          ? "border-t pt-2 mt-1 border-white/10 dark:border-white/10"
          : "",
        bold ? "font-semibold" : "",
        big ? "text-base" : "",
      ].join(" ")}
    >
      <span className="col-span-3">{label}</span>
      <span className="text-right">
        {code} {Number(value || 0).toFixed(2)}
      </span>
    </div>
  );
}
