"use client";

import { JSX, useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CreditCard,
  DollarSign,
  BookOpenCheck,
  Gift,
  Banknote,
  CheckSquare,
  Wallet,
  Trash2,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { createPosOrder } from "@/redux/slices/createPosOrderSlice";
import { createPosInvoice } from "@/redux/slices/createPosInvoiceSlice";
import {
  fetchCurrencyMas,
  selectCurrencyMasItems,
  selectCurrencyMasLoading,
  selectCurrencyMasError,
  selectCurrencyMasSuccess,
} from "@/redux/slices/fetchCurrencyMasSlice";
import { RootState } from "@/redux/store";
import { setPayments, setSelectedForm } from "@/redux/slices/checkoutFlowSlice";
import { closePayment, openPayment } from "@/redux/slices/checkoutFlowSlice";
import {
  fetchGLAccount,
  selectGLAccountData,
  selectGLAccountLoading,
  selectGLAccountError,
} from "@/redux/slices/fetchGLAccountSlices";
import { Label } from "@/components/ui/label";

import buildReceiptEmailHtml from "@/lib/email/buildPOSReceiptEmailHtml";
import {
  sendCustomEmail,
  selectEmailSending,
  selectEmailError,
  selectEmailLastResponse,
} from "@/redux/slices/emailSendSlice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useRef } from "react";
import buildPOSReceipt80mmHtml from "@/lib/print/buildPOSReceipt80mmHtml";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  TableFooter,
} from "@/components/ui/table";


import { fetchReservationMas } from "@/redux/slices/fetchReservationMasSlice";
import { selectReservationMasData } from "@/redux/slices/fetchReservationMasSlice";
import { useClientStorage } from "@/hooks/useClientStorage";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { fetchNameMas, selectFetchNameMasItems } from "@/redux/slices/fetchNameMasSlice";
import { useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";

type PaymentMethod =
  | "cash"
  | "card"
  | "cityLedger"
  | "giftVoucher"
  // tiles you may enable later:
  | "bankTransfer"
  | "check"
  | "includeToMealPlan"
  | "roomPost" // ✅ add
  | "complimentary";

type CartItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
  quantity: number;
  itemCode?: string;
};

type PostedSnapshot = {
  docNo: string;
  cart: CartItem[];
  payments: PaymentEntry[];
  grand: number;
  tax?: TaxBreakdown;
  deliveryDetails: Record<string, string>;
  selectedProperty: any;
};

type PaymentEntry = {
  method: PaymentMethod;
  // amount entered by user IN THE SELECTED CURRENCY (foreign)
  amount: number;
  // GL for this payment method
  accountId: number;
  // currency info
  currencyCode: string; // e.g. "LKR", "USD"
  exchangeRate: number; // local = foreign * exchangeRate
  // derived
  amountLocal: number; // computed when recording
  details?: {
    cardType?: string;
    cardNo?: string;
    voucherCode?: string;
    ref?: string;
  };
  nameId?: number;
};

type TaxBreakdown = {
  base: number;
  scPct: number;
  tdlPct: number;
  ssclPct: number;
  vatPct: number;
  sc: number;
  tdl: number;
  sscl: number;
  vat: number;
  grand: number;
};

interface PaymentMethodSelectionProps {
  total: number;
  cart: CartItem[];
  deliveryMethod: string;
  deliveryDetails: Record<string, string>;
  onComplete: () => void;
  posCenter: string;
  posCenterName?: string;
  tranMasId?: number;
  tax?: TaxBreakdown;
  fromTableManagement?: boolean;
}


type TaxLine = {
  name: string; // taxName
  pct: number; // percentage
  basedOn: string; // calcBasedOn
  accountId?: number;
  amount: number; // computed (local/outlet currency)
  levelBase: number;
};

type PosCenterTaxCfg = {
  recordId: number;
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string; // e.g., "CITY TAX", "SERVICE CHARGE", "GST"
  percentage: number; // 0-100
  calcBasedOn: string; // "base", "subtotal1", "subtotal2", ...
  accountId?: number; // GL to credit
};

type TaxTotals = {
  lines: TaxLine[];
  taxTotal: number;
  subTotal: number;
  grand: number;
};



type LSOutlet = {
  hotelPosCenterId?: number;
  outletCurrency?: string;
  posCenter?: string; // display name, e.g. "Outlet 2"
  serviceCharge?: number;
  taxes?: number;
};





// === REPLACE tileBase ===
// REPLACE tileBase
const tileBase =
  "flex items-center gap-3 rounded-2xl border px-2 py-2 bg-transparent dark:bg-transparent " +
  "hover:bg-white/5 transition data-[sel=true]:ring-2 data-[sel=true]:ring-[#224FB6]";

const formCardBase = "bg-[#F7F8FA] dark:bg-neutral-900 p-4 rounded-xl border "; // was p-6

export function PaymentMethodSelection({
  total,
  cart,
  deliveryMethod,
  deliveryDetails,
  onComplete,
  posCenter,
  posCenterName,
  tranMasId,
  tax,
  fromTableManagement,
}: PaymentMethodSelectionProps) {




  const dispatch = useDispatch();
  const currencies = useSelector(selectCurrencyMasItems);
  const currencyLoading = useSelector(selectCurrencyMasLoading);
  const currencyError = useSelector(selectCurrencyMasError);
  const loadedOnce = useSelector(selectCurrencyMasSuccess);

  console.log("fromTableManagement : ", fromTableManagement);

  console.log("total : ", total);
  console.log("posCenterName aaaaa : ", posCenterName);


  console.log("cart : ", cart);
  console.log("tranMasId : ", tranMasId);
  console.log("tax : ", tax);
  console.log("posCenter : ", cart);

  const glAccounts = useSelector(selectGLAccountData);
  const glLoading = useSelector(selectGLAccountLoading);
  const glError = useSelector(selectGLAccountError);

  const emailSending = useSelector(selectEmailSending);
  const emailErr = useSelector(selectEmailError);
  const emailLast = useSelector(selectEmailLastResponse);

  const [postActionsOpen, setPostActionsOpen] = useState(false);
  const [lastDocNo, setLastDocNo] = useState<string>("");
  const [emailTo, setEmailTo] = useState<string>(deliveryDetails?.email || "");
  const [emailSubject, setEmailSubject] = useState<string>("");

  const getCurrency = (list: any[], code?: string) =>
    list.find((c) => c.currencyCode === code) ?? null;
  const [submitting, setSubmitting] = useState(false);
  const [postedSnap, setPostedSnap] = useState<PostedSnapshot | null>(null);

  const [printHtml, setPrintHtml] = useState<string>("");
  const [isRoomPost, setIsRoomPost] = useState(false);

  const reservations = useSelector(selectReservationMasData);
  const { fullName } = useUserFromLocalStorage();
  const hotelCurrency = useStoredCurrencyCode();



  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);


  console.log("systemDate : ", systemDate);


  // which reservation & which room tile user chose
  const [selectedReservationId, setSelectedReservationId] = useState<
    number | null
  >(null);
  const [selectedRoom, setSelectedRoom] = useState<{
    reservationID: number;
    reservationDetailID: number;
    roomID: number;
    roomNumber: string;
  } | null>(null);

  // Rounding for calculations (4 decimals for precision)
  const round4 = (n: number) => Number((n ?? 0).toFixed(4));
  // Rounding for UI display (2 decimals)
  const round2 = (n: number) => Number((n ?? 0).toFixed(2));

  function mapPaymentMethodForOrder(
    payments: PaymentEntry[],
    deliveryMethod: string
  ) {
    const primary = payments[0]?.method;
    if (primary === "roomPost") return "roompost";
    if (primary === "giftVoucher") return "giftvoucher";
    if (primary === "cityLedger") return "cityledger";
    if (primary === "bankTransfer") return "banktransfer";
    if (primary === "check") return "check";
    if (primary === "complimentary") return "complimentary";
    if (primary === "card") return "card";
    if (primary === "cash") return "cash";
    // fallback by delivery type
    const dm = (deliveryMethod || "").toLowerCase();
    if (dm === "dinein") return "hold";
    if (dm === "roomservice") return "roompost";
    return "cash";
  }
  const [selectedTravelAgent, setSelectedTravelAgent] = useState<string>("");
  const data = useSelector(selectFetchNameMasItems);

  console.log("data : ", data);

  useEffect(() => {
    (dispatch as any)(fetchNameMas({}));
  }, [dispatch]);

  console.log("selectedTravelAgent : ", selectedTravelAgent);

  const outletInfo: LSOutlet = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_OUTLET_OBJ) || "{}");
    } catch {
      return {};
    }
  }, []);

  const outletName =
    posCenterName ||
    outletInfo.posCenter ||
    String(posCenter);
  const outletId = Number(
    outletInfo.hotelPosCenterId ?? (Number(posCenter) || 0)
  );

  // Tax computation: use empty config since parent already computed taxes
  // This function is kept for fallback scenarios
  const taxTotals = useMemo(() => {
    return computeTaxesFromConfig([], cart ?? []);
  }, [cart]);

  // Convert tax prop to TaxLine format for consistency
  const fallbackTaxLines = useMemo(() => {
    if (!tax) return [];
    const entries = [
      {
        key: "servicecharge",
        label: "Service Charge",
        amount: tax.sc,
        pct: tax.scPct,
      },
      { key: "tdl", label: "TDL", amount: tax.tdl, pct: tax.tdlPct },
      { key: "sscl", label: "SSCL", amount: tax.sscl, pct: tax.ssclPct },
      { key: "vat", label: "VAT", amount: tax.vat, pct: tax.vatPct },
    ];

    const lines: TaxLine[] = [];
    for (const entry of entries) {
      const amt = round4(Number(entry.amount || 0));
      if (!amt) continue;
      lines.push({
        name: entry.label,
        pct: Number(entry.pct ?? 0),
        basedOn: "base",
        accountId: undefined,
        amount: amt,
        levelBase: tax?.base ?? 0,
      });
    }
    return lines;
  }, [tax]);

  const taxLines = useMemo(() => {
    return (taxTotals.lines?.length ? taxTotals.lines : fallbackTaxLines) ?? [];
  }, [taxTotals.lines, fallbackTaxLines]);

  const subTotalLocal = useMemo(() => {
    if (taxTotals.lines?.length) return taxTotals.subTotal;
    if (typeof tax?.base === "number") return round4(tax.base);
    return taxTotals.subTotal;
  }, [taxTotals.lines, taxTotals.subTotal, tax?.base]);

  const taxTotalLocal = useMemo(
    () =>
      round4(
        (taxLines ?? []).reduce((t, line) => t + Number(line.amount || 0), 0)
      ),
    [taxLines]
  );

  /**
   * TAX LADDER CALCULATION
   *
   * Supported calcBasedOn values (case-insensitive):
   * - "base", "amount"
   * - "sub1", "subtotal1", "st1"
   * - "sub2", "subtotal2", "st2"
   * - ... up to sub5
   *
   * Steps (example with base = 100):
   *   - Base-level taxes (SERVICE CHARGE, TDL) on 100
   *     Sub1 = 100 + SC + TDL
   *   - Sub1-level taxes (SSCL) on Sub1
   *     Sub2 = Sub1 + SSCL
   *   - Sub2-level taxes (VAT) on Sub2
   *
   * GrandTotal = Base + sum(all tax amounts)
   */
  function computeTaxesFromConfig(
    cfgs: PosCenterTaxCfg[] = [],
    cartItems: { price: number; quantity: number }[] = []
  ): TaxTotals {
    // 1) Base = item total
    const base = round4(
      cartItems.reduce(
        (t, it) => t + Number(it.price || 0) * Number(it.quantity || 0),
        0
      )
    );

    // 2) Normalize calcBasedOn into: "base", "sub1", "sub2", ...
    const normalizeLevel = (val: string | null | undefined): string => {
      const s = (val || "").trim().toLowerCase();

      if (!s || s === "base" || s === "amount") return "base";

      if (s === "sub1" || s === "subtotal1" || s === "st1") return "sub1";
      if (s === "sub2" || s === "subtotal2" || s === "st2") return "sub2";
      if (s === "sub3" || s === "subtotal3" || s === "st3") return "sub3";
      if (s === "sub4" || s === "subtotal4" || s === "st4") return "sub4";
      if (s === "sub5" || s === "subtotal5" || s === "st5") return "sub5";

      // Unknown -> treat as base
      return "base";
    };

    // 3) Group configs by normalized level
    const taxesByLevel = new Map<string, PosCenterTaxCfg[]>();

    cfgs.forEach((c) => {
      const pct = Number(c.percentage ?? 0);
      if (!pct) return; // ignore 0% taxes at this stage

      const level = normalizeLevel(c.calcBasedOn);
      if (!taxesByLevel.has(level)) taxesByLevel.set(level, []);
      taxesByLevel.get(level)!.push(c);
    });

    // Ladder sequence
    const levelOrder = ["base", "sub1", "sub2", "sub3", "sub4", "sub5"];

    const lines: TaxLine[] = [];

    let runningAmount = base;

    console.log("computeTaxesFromConfig - INPUT", {
      base,
      cfgs: cfgs.map((c) => ({
        name: c.taxName,
        pct: c.percentage,
        basedOn: c.calcBasedOn,
        hotelPOSCenterId: c.hotelPOSCenterId,
      })),
    });

    for (const level of levelOrder) {
      const taxesAtLevel = taxesByLevel.get(level) || [];
      if (!taxesAtLevel.length) continue;

      const baseForLevel = runningAmount;
      let levelTaxSum = 0;

      taxesAtLevel.forEach((taxCfg) => {
        const name = (taxCfg.taxName || "").trim();
        const pct = Number(taxCfg.percentage ?? 0);
        if (!pct) return;

        const amount = round4((baseForLevel * pct) / 100);

        console.log(`Calculating ${name} (${pct}%) on ${level}`, {
          baseForLevel,
          amount,
        });

        lines.push({
          name,
          pct,
          basedOn: level,
          accountId: taxCfg.accountId,
          amount,
          levelBase: baseForLevel,
        });

        levelTaxSum += amount;
      });

      const resultingAmount = round4(baseForLevel + levelTaxSum);

      console.log(
        `After level ${level}: ${baseForLevel} + ${levelTaxSum} = ${resultingAmount}`
      );

      runningAmount = resultingAmount;
    }

    const taxTotal = round4(lines.reduce((t, x) => t + (x.amount || 0), 0));
    const grand = round4(base + taxTotal);

    console.log("computeTaxesFromConfig - RESULT", {
      base,
      taxTotal,
      grand,
      lines: lines.map((l) => ({
        name: l.name,
        pct: l.pct,
        amount: l.amount,
        basedOn: l.basedOn,
      })),
    });

    return { lines, taxTotal, subTotal: base, grand };
  }


  const allRooms = useMemo(() => {
    const list =
      (reservations ?? []).flatMap((r: any) =>
        (r.rooms ?? []).map((rm: any) => ({
          reservationID: r.reservationID ?? r.reservationId ?? (r as any).id ?? 0,
          reservationDetailID: rm.reservationDetailID,
          roomID: rm.roomID,
          roomNumber: rm.roomNumber,
          statusColor:
            rm.reservationStatusMaster?.reservationStatusColour || "#e5e7eb",
        }))
      ) ?? [];

    // de-duplicate by reservationDetailID
    const seen = new Set<number>();
    return list.filter((x) => {
      if (seen.has(x.reservationDetailID)) return false;
      seen.add(x.reservationDetailID);
      return true;
    });
  }, [reservations]);

  const CARD_BRANDS = [
    {
      key: "visa",
      label: "Visa",
      img: "https://hotelmate-internal.s3.us-east-1.amazonaws.com/visa.png",
    },
    {
      key: "master",
      label: "Mastercard",
      img: "https://hotelmate-internal.s3.us-east-1.amazonaws.com/mastercard.png",
    },
    {
      key: "amex",
      label: "American Express",
      img: "https://hotelmate-internal.s3.us-east-1.amazonaws.com/amex.png",
    },
  ] as const;

  type CardBrandKey = (typeof CARD_BRANDS)[number]["key"];
  const brandMeta = (k?: string) =>
    CARD_BRANDS.find((b) => b.key === k) ?? CARD_BRANDS[0];

  // helpers to format/mask card numbers
  function formatCardNumber(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }
  function last4(v: string) {
    const d = v.replace(/\D/g, "");
    return d.slice(-4);
  }
  const maskWithLast4 = (last4: string) =>
    `****** ********** ${last4 || "____"}`;

  // If a currency has no exchangeRate coming from API, fall back to 1 for LKR, otherwise 1 by default.
  // OLD
  // const getRate = (c: any | null) => {
  //   if (!c) return 1;
  //   if (typeof c.exchangeRate === "number" && isFinite(c.exchangeRate))
  //     return c.exchangeRate || 1;
  //   return c.currencyCode === "LKR" ? 1 : 1;
  // };

  // NEW
  const getRate = (c: any | null) => {
    if (!c) return 1;

    const raw =
      typeof c.exchangeRate === "number"
        ? c.exchangeRate
        : typeof c.conversionRate === "number"
          ? c.conversionRate
          : typeof c.buyingRate === "number"
            ? c.buyingRate
            : 1;

    const rate = Number(raw);
    return Number.isFinite(rate) && rate > 0 ? rate : 1;
  };

  const selectedProperty = useMemo(
    () => JSON.parse(localStorage.getItem("selectedProperty") || "{}"),
    []
  );
  const hotelId = selectedProperty?.hotelId ?? selectedProperty?.id ?? 0;

  // fetch once
  useEffect(() => {
    (dispatch as any)(fetchGLAccount());
  }, [dispatch]);

  // your filter (as you wrote)
  const filteredAccounts = useMemo(
    () =>
      (Array.isArray(glAccounts) ? glAccounts : []).filter(
        (acc) =>
          (acc.hotelID === String(hotelId) || acc.hotelID === "0") &&
          acc.accountTypeID === 1 &&
          acc.finAct === false
      ),
    [glAccounts, hotelId]
  );

  const [invoiceAccountId, setInvoiceAccountId] = useState<number>(
    filteredAccounts[0]?.accountID ?? 0
  );

  const computedGrandValue = taxTotals.lines?.length
    ? taxTotals.grand
    : round4(tax?.grand ?? subTotalLocal + taxTotalLocal);
  const grand = useMemo(
    () => Number((computedGrandValue ?? 0).toFixed(4)),
    [computedGrandValue]
  );

  function buildPrintHtmlFromSnapshot() {
    if (!postedSnap) return "<html><body>Receipt not available.</body></html>";

    const {
      docNo,
      cart: snapCart,
      payments: snapPays,
      grand: snapGrand,
      tax: snapTax,
      deliveryDetails: snapDelivery,
      selectedProperty: snapProp,
    } = postedSnap;

    const receiptLines = snapCart.map((it) => {
      const code = (it as any).itemCode || (it as any).code || it.id || ""; // fallback to id if needed
      const label = code ? `${code} - ${it.name || "Item"}` : it.name || "Item";

      return {
        itemDescription: label, // ⬅️ includes item code + name
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        lineTotal: round2(Number(
          (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(4)
        )),
      };
    });

    const paymentsForPrint = snapPays.map((p) => ({
      label: p.method ? p.method.toUpperCase() : "PAYMENT",
      foreignAmount:
        typeof p.amount === "number" ? Number(p.amount) : undefined,
      foreignCurrency: p.currencyCode || outletCurrency || "",
      localAmount: Number(p.amountLocal || 0),
      localCurrency: outletCurrency || "",
    }));

    return buildPOSReceipt80mmHtml({
      hotelName:
        snapProp?.name || snapProp?.hotelName || snapProp?.hotelCode || "Hotel",
      docNo,
      dateISO: new Date().toISOString(),
      tableNo: snapDelivery?.tableNo,
      roomNo: snapDelivery?.roomNo,
      cashier: fullName || "POS", // ⬅️ real cashier
      posCenterName: outletName, // ⬅️ if your builder supports this
      items: receiptLines,
      subtotal: Number(subTotalLocal.toFixed(2)),
      taxes: toReceiptTaxList(taxLines),
      grand: Number(grand.toFixed(2)),
      payments: paymentsForPrint,
      footerNote: `POS Center: ${outletName} • Cashier: ${fullName || "POS"}`, // ⬅️ visible even if builder ignores posCenterName
    });
  }

  // Reuse your GLAccountSelect for header-level invoice GL
  function InvoiceGLPicker() {
    return (
      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm font-medium">Invoice Account</div>
        <GLAccountSelect
          value={invoiceAccountId}
          onChange={setInvoiceAccountId}
        />
        {!invoiceAccountId && (
          <div className="text-xs text-red-500">
            Please select a GL account.
          </div>
        )}
      </div>
    );
  }

  const isPaymentOpen = useSelector(
    (s: RootState) => s.checkoutFlow.isPaymentOpen
  );

  function GLAccountSelect({
    value,
    onChange,
  }: {
    value?: number | null;
    onChange: (v: number) => void;
  }) {
    return (
      <Select
        value={value ? String(value) : undefined}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={glLoading ? "Loading accounts..." : "Select Account"}
          />
        </SelectTrigger>
        <SelectContent>
          {filteredAccounts.map((acc) => (
            <SelectItem key={acc.accountID} value={String(acc.accountID)}>
              {acc.accountCode} — {acc.accountName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  useEffect(() => {
    if (!loadedOnce) {
      (dispatch as any)(fetchCurrencyMas()); // or fetchCurrencyMas({})
    }
  }, [dispatch, loadedOnce]);

  console.log("currencies : ", currencies);

  // ---- State
  const selectedForm = useSelector(
    (s: RootState) => s.checkoutFlow.selectedForm
  );
  const payments = useSelector((s: RootState) => s.checkoutFlow.payments);
  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (t, p) => t + (Number.isFinite(p.amount) ? p.amount : 0),
        0
      ),
    [payments]
  );

  const travelAgentOptions = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list
      .filter((n: any) => {
        const t = String(n?.nameType || "").toLowerCase();
        return (t === "customer" || t === "agent") && n?.finAct === false;
      })
      .sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      )
      .map((n: any) => ({
        value: String(n.nameID),
        label: n.name?.trim() || n.code || `#${n.nameID}`,
        taType: n.taType || "",
        nameType: n.nameType || "",
      }));
  }, [data]);

  const setSelectedFormLocal = (v: PaymentMethod | null) =>
    dispatch(setSelectedForm(v));
  const setPaymentsLocal = (
    next: PaymentEntry[] | ((p: PaymentEntry[]) => PaymentEntry[])
  ) => {
    const current = payments;
    const value = typeof next === "function" ? (next as any)(current) : next;
    dispatch(setPayments(value));
  };

  const removeForm = () => setSelectedFormLocal(null);

  const toggleForm = (m: PaymentMethod) =>
    setSelectedFormLocal(selectedForm === m ? null : m);
  // ---- Helpers
  const addForm = (m: PaymentMethod) => setSelectedForm(m);
  const removePayment = (idx: number) =>
    setPaymentsLocal((prev) => prev.filter((_, i) => i !== idx));

  // Add new recordPayment that converts to local using selected currency's rate
  const recordPayment = (
    entry: Omit<PaymentEntry, "amountLocal" | "exchangeRate"> & {
      exchangeRate?: number;
    }
  ) => {
    // Validate amount + account
    if (!entry.amount || entry.amount <= 0 || !entry.accountId) return;

    const c = getCurrency(currencies, entry.currencyCode);
    const rate = entry.exchangeRate ?? getRate(c);
    // Calculate with full precision, then round to 4 decimals for storage
    const local = round4(entry.amount * rate);

    // Cap by remaining (in local)
    const allowedLocal = Math.min(local, remaining);
    if (allowedLocal <= 0) return;

    // If we capped, recompute foreign back so the line stays consistent
    const adjustedForeign = round4(allowedLocal / rate);

    setPaymentsLocal((prev) => [
      ...prev,
      {
        ...entry,
        exchangeRate: rate,
        amount: adjustedForeign,
        amountLocal: allowedLocal,
      },
    ]);

    setSelectedFormLocal(null);
  };

  useEffect(() => {
    if (selectedForm === "roomPost") {
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelCode = selectedProperty?.hotelCode || "";

      (dispatch as any)(
        fetchReservationMas({
          hotelCode,
          status: "Checked In", // Equivalent to reservationStatusId: 4
        })
      );
    }
  }, [dispatch, selectedForm]);

  // If user overpays (after edits), trim the tail lines automatically
  // useEffect(() => {
  //   const paidLocal = payments.reduce(
  //     (t, p) => t + (Number.isFinite(p.amountLocal) ? p.amountLocal : 0),
  //     0
  //   );
  //   if (paidLocal > grand) {
  //     const copy = [...payments];
  //     let excess = Number((paidLocal - grand).toFixed(2));
  //     for (let i = copy.length - 1; i >= 0 && excess > 0; i--) {
  //       const cutLocal = Math.min(copy[i].amountLocal, excess);
  //       const newLocal = Number((copy[i].amountLocal - cutLocal).toFixed(2));
  //       if (newLocal <= 0) {
  //         excess = Number((excess - copy[i].amountLocal).toFixed(2));
  //         copy.splice(i, 1);
  //       } else {
  //         const ratio = newLocal / copy[i].amountLocal;
  //         copy[i] = {
  //           ...copy[i],
  //           amountLocal: newLocal,
  //           amount: Number((copy[i].amount * ratio).toFixed(2)),
  //         };
  //         excess = Number((excess - cutLocal).toFixed(2));
  //       }
  //     }
  //     dispatch(setPayments(copy));
  //   }
  // }, [grand, payments, dispatch]);

  // (if you keep the older effect that compares foreign "amount", also switch to `grand` there)
  // useEffect(() => {
  //   const paidForeign = payments.reduce(
  //     (t, p) => t + (Number.isFinite(p.amount) ? p.amount : 0),
  //     0
  //   );
  //   if (paidForeign > grand) {
  //     const copy = [...payments];
  //     let excess = paidForeign - grand;
  //     for (let i = copy.length - 1; i >= 0 && excess > 0; i--) {
  //       const cut = Math.min(copy[i].amount, excess);
  //       copy[i] = {
  //         ...copy[i],
  //         amount: Number((copy[i].amount - cut).toFixed(2)),
  //       };
  //       excess = Number((excess - cut).toFixed(2));
  //       if (copy[i].amount <= 0) copy.splice(i, 1);
  //     }
  //     dispatch(setPayments(copy));
  //   }
  // }, [grand, payments, dispatch]);

  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  /** Try common fields in order and return a numeric item id (no 0 unless truly missing) */
  const getItemId = (it: any): number => {
    return (
      toNum(it.itemId) ??
      toNum(it.itemID) ??
      toNum(it.id) ?? // will work if id is "123"
      0
    );
  };

  // useEffect(() => {
  //   const paid = payments.reduce(
  //     (t, p) => t + (Number.isFinite(p.amount) ? p.amount : 0),
  //     0
  //   );
  //   if (paid > total) {
  //     const copy = [...payments];
  //     let excess = paid - total;
  //     for (let i = copy.length - 1; i >= 0 && excess > 0; i--) {
  //       const cut = Math.min(copy[i].amount, excess);
  //       copy[i] = { ...copy[i], amount: copy[i].amount - cut };
  //       excess -= cut;
  //       if (copy[i].amount <= 0) copy.splice(i, 1);
  //     }
  //     dispatch(setPayments(copy));
  //   }
  // }, [total, payments, dispatch]);

  const samePayments = (a: PaymentEntry[], b: PaymentEntry[]) =>
    a.length === b.length &&
    a.every(
      (x, i) =>
        x.method === b[i].method &&
        x.accountId === b[i].accountId &&
        x.currencyCode === b[i].currencyCode &&
        Number(x.amount.toFixed(2)) === Number(b[i].amount.toFixed(2)) &&
        Number(x.amountLocal.toFixed(2)) ===
        Number(b[i].amountLocal.toFixed(2)) &&
        Number((x.exchangeRate ?? 0).toFixed(6)) ===
        Number((b[i].exchangeRate ?? 0).toFixed(6))
    );

  useEffect(() => {
    const eps = 0.005; // 0.5c guard for rounding noise
    const paidLocal = payments.reduce(
      (t, p) => t + (Number.isFinite(p.amountLocal) ? p.amountLocal : 0),
      0
    );

    if (paidLocal <= grand + eps) return; // nothing to fix

    const next = [...payments].map((p) => ({ ...p })); // clone for edits
    let excess = Number((paidLocal - grand).toFixed(4));

    // trim from the tail
    for (let i = next.length - 1; i >= 0 && excess > 0; i--) {
      const cutLocal = Math.min(next[i].amountLocal, excess);
      const prevLocal = next[i].amountLocal;
      const newLocal = Number((prevLocal - cutLocal).toFixed(4));

      if (newLocal <= eps) {
        // remove whole line
        excess = Number((excess - prevLocal).toFixed(4));
        next.splice(i, 1);
      } else {
        const ratio = newLocal / prevLocal; // keep FX ratio
        next[i].amountLocal = newLocal;
        next[i].amount = Number((next[i].amount * ratio).toFixed(4));
        excess = Number((excess - cutLocal).toFixed(4));
      }
    }

    // don't dispatch if nothing really changed
    if (!samePayments(payments, next)) {
      dispatch(setPayments(next));
    }
  }, [grand, payments, dispatch]);

  const LS_OUTLET_OBJ = "hm_selected_pos_center";

  const [outletCurrency, setOutletCurrency] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(LS_OUTLET_OBJ);
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setOutletCurrency(obj?.outletCurrency || "LKR");
      } catch {
        setOutletCurrency("LKR");
      }
    }
  }, []);

  const totalPaidLocal = useMemo(
    () =>
      round4(
        payments.reduce(
          (t, p) => t + (Number.isFinite(p.amountLocal) ? p.amountLocal : 0),
          0
        )
      ),
    [payments]
  );
  // Calculate remaining with 4 decimal precision
  const remainingRaw = Math.max(0, round4(grand - totalPaidLocal));
  // If remaining is less than 0.01 (1 cent), treat it as 0 to avoid rounding issues
  const REMAINING_TOLERANCE = 0.01;
  const remaining = remainingRaw < REMAINING_TOLERANCE ? 0 : remainingRaw;
  const isFullyPaid = remaining < REMAINING_TOLERANCE;

  useEffect(() => {
    if (!invoiceAccountId && filteredAccounts.length > 0) {
      setInvoiceAccountId(filteredAccounts[0].accountID);
    }
  }, [filteredAccounts, invoiceAccountId]);

  function EnteredRow({
    amount,
    setAmount,
    currencyCode,
    setCurrencyCode,
  }: {
    amount: string;
    setAmount: (v: string) => void;
    currencyCode: string;
    setCurrencyCode: (v: string) => void;
  }) {
    const [pairRate, setPairRate] = useState<number>(1);

    useEffect(() => {
      const rate = getPairRate(currencyCode, outletCurrency);
      setPairRate(rate);
    }, [currencyCode, outletCurrency]);

    const approx = (() => {
      const n = Number(amount);
      return Number.isFinite(n) ? Number((n * pairRate).toFixed(4)).toFixed(2) : "0.00";
    })();

    return (
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-12">
          <div className="text-sm font-medium">Payment Details</div>
        </div>

        <div className="col-span-12">
          <div className="text-xs text-muted-foreground mb-1">Entered</div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="col-span-4">
              <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
            </div>
            <div className="col-span-2 flex items-center text-xs text-muted-foreground">
              ≈ {outletCurrency} {approx}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TRAN_TYPE_INVOICE = 2; // invoice/sale
  const TRAN_TYPE_PAYMENT = 17;

  const taxAmountsLocal: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of taxLines) {
      map[line.name.toUpperCase()] = Number(line.amount || 0);
    }
    return map;
  }, [taxLines]);

  const {
    serviceChargeAmount: serviceChargeAmountLocal,
    serviceChargeAccountId,
    tdlAmount: tdlAmountLocal,
    tdlAccountId,
    ssclAmount: ssclAmountLocal,
    ssclAccountId,
    vatAmount: vatAmountLocal,
    vatAccountId,
  } = useMemo(() => {
    const normalize = (name?: string) =>
      (name || "").replace(/\s+/g, "").toLowerCase();

    const findLine = (matchers: string[]) =>
      taxLines.find((line) => {
        const norm = normalize(line.name);
        return matchers.some((m) => norm.includes(m));
      });

    const valueFrom = (
      line: TaxLine | undefined,
      fallback: number | undefined
    ) => round4(line?.amount ?? Number(fallback || 0));

    const serviceLine = findLine(["servicecharge", "sc"]);
    const tdlLine = findLine(["tdl"]);
    const ssclLine = findLine(["sscl"]);
    const vatLine = findLine(["vat"]);

    return {
      serviceChargeAmount: valueFrom(serviceLine, tax?.sc),
      serviceChargeAccountId: Number(serviceLine?.accountId || 0),
      tdlAmount: valueFrom(tdlLine, tax?.tdl),
      tdlAccountId: Number(tdlLine?.accountId || 0),
      ssclAmount: valueFrom(ssclLine, tax?.sscl),
      ssclAccountId: Number(ssclLine?.accountId || 0),
      vatAmount: valueFrom(vatLine, tax?.vat),
      vatAccountId: Number(vatLine?.accountId || 0),
    };
  }, [taxLines, tax]);

  const toWhole = (value?: number | null) => {
    if (!Number.isFinite(Number(value))) return 0;
    return Math.round(Number(value));
  };

  const getPairRate = (baseCurrency: string, targetCurrency: string): number => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency)
      return 1;

    // Find the target currency in the currencies array
    const targetCurrencyObj = currencies.find(
      (c) => c.currencyCode === targetCurrency
    );

    // If target currency is found, use its exchange rate
    // This assumes all rates are relative to a base currency (e.g., LKR)
    if (targetCurrencyObj) {
      const targetRate = getRate(targetCurrencyObj);

      // If base currency is the same as the system base, return target rate directly
      if (baseCurrency === outletCurrency || baseCurrency === hotelCurrency) {
        return targetRate;
      }

      // Otherwise, find the base currency rate and calculate cross rate
      const baseCurrencyObj = currencies.find(
        (c) => c.currencyCode === baseCurrency
      );

      if (baseCurrencyObj) {
        const baseRate = getRate(baseCurrencyObj);
        // Cross rate: (1 base = X target) = targetRate / baseRate
        return baseRate > 0 ? targetRate / baseRate : 1;
      }
    }

    // Fallback: return 1 if currencies not found
    return 1;
  };

  function toReceiptTaxList(lines: TaxLine[]) {
    return lines
      .filter((l) => Math.abs(l.amount ?? 0) > 0.000001) // 🔹 hide 0.000000
      .map((l) => ({
        label: `${l.name} (${round2(l.pct)}%)`,
        amount: round2(l.amount), // Display uses round2
      }));
  }
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const now = systemDate || new Date().toISOString();
      const docNo = `DOC-${Date.now()}`;

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelCode = selectedProperty?.hotelCode || "DEFAULT_CODE";
      const propertyID = Number(
        selectedProperty?.hotelId || selectedProperty?.id || 0
      );
      // hotelCurrency is already available from useStoredCurrencyCode() hook

      const tableNo = deliveryDetails.tableNo || "string";
      const noOfPax = deliveryDetails.noOfPax
        ? Number(deliveryDetails.noOfPax)
        : 0;
      const roomId = deliveryDetails.roomNo
        ? Number(deliveryDetails.roomNo)
        : 0;

      // Get exchange rate from outlet currency to hotel currency
      const exchangeRateToHotel = getPairRate(outletCurrency, hotelCurrency);

      // Totals in outlet currency (user-paid currency)
      const grossOutlet = Number(grand.toFixed(4)); // grand in outlet currency
      const paidOutlet = Number(
        payments.reduce((t, p) => t + (p.amountLocal || 0), 0).toFixed(4)
      );
      const remainingOutlet = Number((grossOutlet - paidOutlet).toFixed(4));

      // Totals in hotel currency (converted)
      const grossHotel = Number((grossOutlet * exchangeRateToHotel).toFixed(4));
      const paidHotel = Number((paidOutlet * exchangeRateToHotel).toFixed(4));
      const remainingHotel = Number((remainingOutlet * exchangeRateToHotel).toFixed(4));

      const cityLedgerPayment = payments.find(
        (p) => p.method === "cityLedger" && p.nameId
      );
      const nameIdFromCityLedger = cityLedgerPayment?.nameId ?? 0;

      // ---- helpers
      type CartItemWithSales = (typeof cart)[number] & {
        salesAccountID?: number;
        salesAccountId?: number;
        salesGl?: number;
        salesGL?: number;
        itemCode?: string;
      };
      const pickPositiveNumber = (...vals: any[]) => {
        for (const v of vals) {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) return n;
        }
        return 7; // ← fallback sales account (set this to your real one)
      };

      const useRoomId =
        hasRoomPost && selectedRoom?.roomID ? selectedRoom.roomID : roomId;

      const useReservationId =
        hasRoomPost && selectedRoom?.reservationID
          ? selectedRoom.reservationID
          : 0;

      const useReservationDetailId =
        hasRoomPost && selectedRoom?.reservationDetailID
          ? selectedRoom.reservationDetailID
          : 0;

      const getSalesAcc = (
        it: CartItem & {
          salesAccountID?: number;
          salesAccountId?: number;
          salesGl?: number;
          salesGL?: number;
        }
      ) =>
        pickPositiveNumber(
          it.salesAccountID,
          it.salesAccountId,
          it.salesGl,
          it.salesGL
        );

      const mkBase = (
        overrides: Partial<any> = {},
        tranTypeId = TRAN_TYPE_INVOICE
      ) => ({
        finAct: false,
        docNo,
        createdBy: fullName,
        createdOn: now,
        tranTypeID: tranTypeId,
        refAccountID: 0,
        siteID: 0,
        tranDate: now,
        dueDate: now,
        chequeDate: now,
        chequePrinted: false,
        paymentVoucherNo: "string",
        offSetAccID: 0,
        chequeNo: "string",
        tranMasID: 0,
        supplierInvoNo: "string",
        taxCode: "string",
        costCenterID: 0,
        billRef: "string",
        paymentReceiptRef: "string",
        reconciled: 0,
        recDate: now,
        propertyID,
        recMasID: 0,
        batchID: 0,
        active: true,
        collectionScheduledOn: now,
        isDue: false,
        isArrears: false,
        isEarlySettlement: false,
        batchNo: 0,
        split: "string",
        effectiveDate: now,
        currencyCode: hotelCurrency || outletCurrency, // Hotel currency for amount/debit/credit
        currCode: outletCurrency, // Outlet currency for currAmount/currDebit/currCredit
        convRate: String(exchangeRateToHotel),
        cardType: "string",
        reservationID: useReservationId,
        reservationDetailID: useReservationDetailId,
        ...overrides,
      });

      // Amounts: amount/debit/credit in hotel currency, currAmount/currDebit/currCredit in outlet currency
      // valOutlet: amount in outlet currency (user-paid currency)
      // valHotel: amount in hotel currency (converted)
      const mkDebit = (base: any, valOutlet: number, valHotel?: number) => {
        const outletAmt = Math.abs(Number(valOutlet.toFixed(4))); // outlet currency
        const hotelAmt = valHotel != null
          ? Math.abs(Number(valHotel.toFixed(4)))
          : Math.abs(Number((valOutlet * exchangeRateToHotel).toFixed(4))); // hotel currency
        return {
          ...base,
          amount: hotelAmt, // ← hotel currency (positive)
          debit: hotelAmt,
          credit: 0,
          currAmount: outletAmt, // ← outlet currency (positive)
          currDebit: outletAmt,
          currCredit: 0,
        };
      };

      const mkCredit = (base: any, valOutlet: number, valHotel?: number) => {
        const outletAmt = Math.abs(Number(valOutlet.toFixed(4))); // outlet currency
        const hotelAmt = valHotel != null
          ? Math.abs(Number(valHotel.toFixed(4)))
          : Math.abs(Number((valOutlet * exchangeRateToHotel).toFixed(4))); // hotel currency
        return {
          ...base,
          amount: -hotelAmt, // ← hotel currency (negative for credits)
          debit: 0,
          credit: hotelAmt, // ← hotel currency (positive)
          currAmount: -outletAmt, // ← outlet currency (negative for credits)
          currDebit: 0,
          currCredit: outletAmt, // ← outlet currency (positive)
        };
      };

      // ---- 1) DR A/R (open invoice for full gross)
      const arDebitOpen = mkDebit(
        mkBase(
          {
            accountID: Number(2), // Customer / A/R
            comment: "POS A/R (Invoice)",
            memo: "A/R open",
            isDue: true,
          },
          TRAN_TYPE_INVOICE
        ),
        grossOutlet // outlet currency amount
      );

      // ---- 2) CR Sales PER-ITEM (your requirement)
      const salesCreditLines = (cart as CartItemWithSales[])
        .map((item) => {
          const accountID = getSalesAcc(item) || 7; // per-item sales account (fallback 7)
          const itemIdNum = getItemId(item);
          const lineLocal = Number(
            (Number(item.price || 0) * Number(item.quantity || 0)).toFixed(4)
          );
          // if (!accountID || lineLocal <= 0) return null;

          const itemCode = (item.itemCode || "").toString().trim();
          const comment = itemCode || item.name || String(itemIdNum);

          return mkCredit(
            mkBase(
              {
                accountID,
                itemID: itemIdNum, // <-- keep item id on the GL row
                comment, // <-- item code or name
                memo: "Item sale",
              },
              TRAN_TYPE_INVOICE
            ),
            lineLocal
          );
        })
        .filter(Boolean) as any[];

      // ---- 3) DR Cash/Bank/Card per payment
      const paymentCashDebits = await Promise.all(
        payments.map(async (p) => {
          // Get payment currency from the entry - this is the currency the user actually paid in
          const paymentCurrency = p.currencyCode || outletCurrency;
          // paymentAmount is the amount in the payment currency (e.g., 80.55 USD)
          const paymentAmount = round4(p.amount || 0);
          if (!paymentAmount) return null;

          // Use the already calculated amountLocal for precision (it's in outlet currency)
          // This ensures consistency with what was displayed/calculated when payment was recorded
          // amountLocal = paymentAmount * exchangeRate (converted to outlet currency)
          let hotelAmt: number;
          let paymentToHotelRate: number;

          if (p.amountLocal) {
            // amountLocal is already calculated in outlet currency with proper precision
            if (outletCurrency === hotelCurrency) {
              // Outlet currency equals hotel currency, use amountLocal directly
              hotelAmt = round4(p.amountLocal);
              paymentToHotelRate = p.exchangeRate || 1;
            } else {
              // Convert from outlet currency (amountLocal) to hotel currency
              paymentToHotelRate = getPairRate(outletCurrency, hotelCurrency || outletCurrency);
              hotelAmt = round4(p.amountLocal * paymentToHotelRate);
            }
          } else {
            // Fallback: calculate fresh if amountLocal not available
            paymentToHotelRate = getPairRate(paymentCurrency, hotelCurrency || outletCurrency);
            hotelAmt = round4(paymentAmount * paymentToHotelRate);
          }

          return {
            ...mkBase(
              {
                accountID: Number((p as any).accountId || 0),
                comment:
                  (p.method || "").toUpperCase() +
                  (p.details?.voucherCode
                    ? ` • ${p.details.voucherCode}`
                    : "") +
                  (p.details?.cardNo ? ` • ${p.details.cardNo}` : ""),
                memo: "POS payment",
                currencyCode: hotelCurrency || outletCurrency, // hotel currency for amount/debit/credit
                currCode: paymentCurrency, // actual payment currency the user paid in (e.g., USD)
                convRate: String(p.exchangeRate || paymentToHotelRate),
                cardType: p.details?.cardType || "string",
              },
              TRAN_TYPE_PAYMENT
            ),
            amount: hotelAmt, // hotel currency (positive) - converted from outlet currency
            debit: hotelAmt,
            credit: 0,
            currAmount: paymentAmount, // actual payment currency amount (e.g., 80.55 USD)
            currDebit: paymentAmount, // actual payment currency amount
            currCredit: 0,
          };
        })
      );

      const paymentCashDebitsFiltered = paymentCashDebits.filter(Boolean) as any[];

      // Recalculate paidHotel from actual payment amounts in hotel currency
      const paidHotelRecalculated = Number(
        paymentCashDebitsFiltered.reduce((sum, p) => sum + (p.debit || 0), 0).toFixed(4)
      );

      // ---- 4) CR A/R for amount paid (settlement on this invoice)
      const customerCreditForPaid =
        paidOutlet > 0
          ? mkCredit(
            mkBase(
              {
                accountID: Number(2),
                comment: "POS A/R Settlement (on invoice)",
                memo: "Reduce A/R by payments",
                isDue: remainingOutlet > 0,
              },
              TRAN_TYPE_PAYMENT
            ),
            paidOutlet // outlet currency amount
          )
          : null;

      const taxCreditLines = (taxLines || [])
        .map((line) => {
          const outletAmt = Number((line.amount || 0).toFixed(4)); // tax amount in outlet currency
          const accId = Number(line.accountId || 0);
          if (!accId || outletAmt <= 0) return null;

          return mkCredit(
            mkBase(
              {
                accountID: accId,
                comment: line.name, // e.g., "GST", "SERVICE CHARGE", "CITY TAX"
                memo: "POS tax",
              },
              TRAN_TYPE_INVOICE
            ),
            outletAmt // outlet currency amount
          );
        })
        .filter(Boolean) as any[];

      // ---- Final GL batch (no zeros; all Amounts positive)
      const glAccTransactions = [
        arDebitOpen, // DR A/R
        ...salesCreditLines, // CR Sales (one per item)
        ...taxCreditLines,
        ...paymentCashDebitsFiltered, // DR Cash/Bank/Card
        ...(customerCreditForPaid ? [customerCreditForPaid] : []), // CR A/R settlement
      ].filter(
        (l) => Number(l.accountID) > 0 && Math.abs(Number(l.amount)) > 0
      );

      // if Room Post, override the IDs from the user's selection

      const payload = {
        glAccTransactions,
        tranMasId: Number(tranMasId || 0),
        posCenter: String(posCenterName || "string"),
        // accountIdDebit: Number(invoiceAccountId || 0),
        accountIdDebit: 0,
        accountIdCredit: 0,
        hotelCode: String(hotelCode),
        finAct: false,
        tranTypeId: 2,
        tranDate: now,
        effectiveDate: now,
        docNo: docNo,
        createdOn: now,
        tranValue: grossHotel, // hotel currency
        nameId: nameIdFromCityLedger,
        chequeNo: "string",
        paymentMethod: payments.map((l) => l.method?.toUpperCase()).join(", "),
        chequeDate: now,
        exchangeRate: exchangeRateToHotel,
        debit: 0,
        amount: grossHotel, // hotel currency
        comment: "string",
        createdBy: fullName,
        currAmount: grossOutlet, // outlet currency (user-paid currency)
        currencyCode: hotelCurrency || outletCurrency, // hotel currency
        currCode: outletCurrency, // outlet currency
        convRate: String(exchangeRateToHotel),
        credit: 0,
        paymentReceiptRef: "string",
        remarks: "string",
        dueDate: now,
        refInvNo: `REF-${Date.now()}`,
        tableNo,
        isFinished: true,
        discPercentage: 0,
        onCost: true,
        startTimeStamp: now,
        endTimeStamp: now,
        roomId: useRoomId,
        noOfPax,
        deliveryMethod: isRoomPost ? "RoomPost" : deliveryMethod || "string",
        phoneNo: deliveryDetails.phoneNumber || "string",
        isPrintKOT: true,
        isPrintBot: true,
        hotelPosCenterId: Number(posCenter) || 0,
        reservationId: useReservationId,
        reservationDetailId: useReservationDetailId,
        items: cart.map((item) => ({
          itemId: getItemId(item),
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          cost: 0,
          lineDiscount: 0,
          comment: item.description || "string",
          itemDescription: item.name || "string",
          isKOT: true,
          isBOT: true,
          cover: "string",
          discPercentage: 0,
          reservationDetailId: useReservationDetailId,
          finAct: "false",
        })),
        accountId: 0,
        isTaxApplied: taxLines.length > 0,
        serviceChargeAmount: toWhole(serviceChargeAmountLocal),
        tdlTaxAmount: toWhole(tdlAmountLocal),
        ssclTaxAmount: toWhole(ssclAmountLocal),
        vatTaxAmount: toWhole(vatAmountLocal),

        // keep IDs if you have them; otherwise 0
        serviceChargeId: serviceChargeAccountId,
        tdlTaxId: tdlAccountId,
        ssclTaxId: ssclAccountId,
        vatTaxId: vatAccountId,
      };

      console.log("payload (json):\n" + JSON.stringify(payload, null, 2));

      // ✅ Only create POS order (HOLD/KOT) for Take Away/Delivery at payment time.
      // - Dine-In orders: Already created when selecting dine-in delivery method, don't create again
      // - Table orders (fromTableManagement): Already have orders, don't create again
      // - Room Service: Already created in delivery drawer, don't create again
      // - Take Away/Delivery: Create order here at payment time (only time order is created)
      const deliveryMethodLower = (deliveryMethod || "").toLowerCase();
      const isDineIn = deliveryMethodLower === "dinein";
      const isRoomService = deliveryMethodLower === "roomservice" || deliveryMethodLower === "room service";
      const isTakeAwayOrDelivery =
        deliveryMethodLower === "takeaway" ||
        deliveryMethodLower === "take away" ||
        deliveryMethodLower === "delivery" ||
        (deliveryMethodLower && !isDineIn && !isRoomService); // Fallback for any other delivery method

      const shouldCreatePosOrder = !fromTableManagement && isTakeAwayOrDelivery;

      if (shouldCreatePosOrder) {
        const orderNow = new Date().toISOString();
        const orderDocNo = `DOC-${Date.now()}`;

        // Resolve room/table context from UI/props
        const orderRoomNumber =
          selectedRoom?.roomNumber || (deliveryDetails.roomNo ?? "");
        const orderRoomId =
          selectedRoom?.roomID ?? (Number(deliveryDetails.roomNo) || 0);
        const orderTableNo =
          (deliveryDetails.tableNo && String(deliveryDetails.tableNo)) ||
          (deliveryMethod?.toLowerCase() === "dinein" ? "TBD" : "N/A");

        // Decide order payment method from what the user actually recorded
        const orderPayMethod = mapPaymentMethodForOrder(
          payments,
          deliveryMethod
        );

        // Build POS Order payload using existing API/state data (no hard-coded tax names/ids)
        const orderPayload = {
          accountId: 0,
          isTaxApplied: true, // taxes are applied (details will be on the invoice)
          ssclTaxAmount: 0,
          ssclTaxId: 0,
          vatTaxAmount: 0,
          vatTaxId: 0,
          serviceChargeAmount: 0,
          serviceChargeId: 0,
          tdlTaxAmount: 0,
          tdlTaxId: 0,

          tranMasId: 0,
          posCenter: String(posCenterName || outletName),
          accountIdDebit: 0,
          accountIdCredit: 0,
          hotelCode: String(selectedProperty?.hotelCode || "DEFAULT_CODE"),
          finAct: false,

          tranTypeId: 75, // HOLD/KOT
          tranDate: now,
          effectiveDate: now,
          docNo: orderDocNo,
          createdOn: now,
          tranValue: grossHotel, // hotel currency
          nameId: 0,
          chequeNo: "",
          paymentMethod: orderPayMethod,
          chequeDate: now,
          exchangeRate: exchangeRateToHotel,
          debit: 0,
          amount: grossHotel, // hotel currency
          comment: "Auto-generated POS Order",
          createdBy: fullName,
          currAmount: grossOutlet, // outlet currency (user-paid currency)
          currencyCode: hotelCurrency || outletCurrency, // hotel currency
          currCode: outletCurrency, // outlet currency
          convRate: String(exchangeRateToHotel),
          credit: 0,
          paymentReceiptRef: "N/A",
          remarks: "Generated by POS checkout",
          dueDate: now,
          refInvNo: `REF-${Date.now()}`,
          tableNo: orderTableNo,
          isFinished: true,
          discPercentage: 0,
          onCost: false,
          startTimeStamp: now,
          endTimeStamp: now,

          // Context by delivery method
          roomId: orderRoomId || 0,
          noOfPax: Number(deliveryDetails.noOfPax || 1),
          deliveryMethod: deliveryMethod || "string",
          phoneNo: String(deliveryDetails.phoneNumber || ""),

          hotelPosCenterId: Number(posCenter) || 0,
          reservationId: selectedRoom?.reservationID || 0,
          reservationDetailId: selectedRoom?.reservationDetailID || 0,

          items: cart.map((it) => ({
            itemId: getItemId(it),
            quantity: Number(it.quantity) || 0,
            price: Number(it.price) || 0,
            cost: 0,
            lineDiscount: 0,
            comment: it.description || "",
            itemDescription: it.name || "Item",
            isKOT: true,
            isBOT: true,
            cover: "",
            discPercentage: 0,
            reservationDetailId: selectedRoom?.reservationDetailID || 0,
            finAct: "false",
          })),

          // Single payment line reflecting how this order is being posted
          payments: [
            {
              method: orderPayMethod,
              amount: grossOutlet, // outlet currency (user-paid currency)
              currency: outletCurrency,
              cardType: payments[0]?.details?.cardType || "",
              lastDigits: payments[0]?.details?.cardNo || "",
              roomNo: orderRoomNumber,
            },
          ],
        };
        console.log("orderPayload : ", JSON.stringify(orderPayload));

        const username = localStorage.getItem("rememberedUsername") || "";

        try {
          await (dispatch as any)(
            createPosOrder({
              username: username || fullName || "POS", // query param
              payload: orderPayload,                   // request body
            })
          ).unwrap();

          console.log(
            "✅ POS Order created for delivery method:",
            deliveryMethod
          );
          console.log("test order sent");
          console.log("orderPayload : ", JSON.stringify(orderPayload));
        } catch (err) {
          console.error("❌ Failed to create POS Order:", err);
          // If order fails, stop here to avoid invoice without KOT/BOT
          setSubmitting(false);
          return;
        }
      }

      await (dispatch as any)(createPosInvoice(payload)).unwrap();
      console.log("payload invoice : ", JSON.stringify(payload));

      console.log("test invoice sent : ");

      console.log("cart:", cart);
      console.log(
        "salesCredit preview:",
        (cart as CartItemWithSales[]).map((it) => ({
          id: getItemId(it),
          rawAccs: [
            it.salesAccountID,
            it.salesAccountId,
            it.salesGl,
            it.salesGL,
          ],
          chosenAcc: getSalesAcc(it),
          lineLocal: Number(
            (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(4)
          ),
        }))
      );
      console.log("salesCreditLines count:", salesCreditLines.length);

      // UI cleanup

      // dispatch(setPayments([]));
      // dispatch(setSelectedForm(null));
      // setInvoiceAccountId(filteredAccounts[0]?.accountID ?? 0);
      // dispatch(closePayment());
      // onComplete?.();
      setLastDocNo(docNo);
      setEmailSubject(`Receipt ${docNo}`);

      const snap = {
        docNo,
        cart: [...cart],
        payments: [...payments],
        grand,
        tax,
        deliveryDetails,
        selectedProperty,
      };
      setPostedSnap(snap);
      setPrintHtml(
        buildPOSReceipt80mmHtml({
          autoPrint: false,
          hotelName:
            selectedProperty?.name ||
            selectedProperty?.hotelName ||
            selectedProperty?.hotelCode ||
            "Hotel",
          docNo,
          dateISO: new Date().toISOString(),
          tableNo: deliveryDetails?.tableNo,
          roomNo: deliveryDetails?.roomNo,
          cashier: fullName || "POS", // ⬅️ cashier
          posCenterName: outletName, // ⬅️ POS center
          items: cart.map((it) => {
            const code =
              (it as any).itemCode || (it as any).code || it.id || "";
            const label = code
              ? `${code} - ${it.name || "Item"}`
              : it.name || "Item";

            return {
              itemDescription: label, // ⬅️ includes item code & name
              quantity: Number(it.quantity || 0),
              price: Number(it.price || 0),
              lineTotal: round2(Number(
                (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(4)
              )),
            };
          }),
          subtotal: Number(subTotalLocal.toFixed(2)),
          taxes: toReceiptTaxList(taxLines),
          grand: Number(grand.toFixed(2)),
          payments: payments.map((p) => ({
            label: p.method ? p.method.toUpperCase() : "PAYMENT",
            foreignAmount:
              typeof p.amount === "number" ? Number(p.amount) : undefined,
            foreignCurrency: p.currencyCode || outletCurrency || "",
            localAmount: Number(p.amountLocal || 0),
            localCurrency: outletCurrency || "",
          })),
          footerNote: `POS Center: ${posCenterName} • Cashier: ${fullName || "POS"
            }`, // ⬅️ nice footer
        })
      );

      // open the drawer

      setPostActionsOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Keep this component in the same file
  const CurrencySelect = ({
    value,
    onChange,
    className,
  }: {
    value?: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={["w-full", className].filter(Boolean).join(" ")}
      >
        <SelectValue
          placeholder={currencyLoading ? "Loading..." : "Currency"}
        />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.currencyID} value={c.currencyCode}>
            {c.currencyCode} — {c.currencyName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // ---- Individual Form Cards (match your screenshot)

  function CashForm() {
    const [currencyCode, setCurrencyCode] = useState<string>(
      currencies?.[0]?.currencyCode ?? "LKR"
    );
    const [amount, setAmount] = useState<string>("");
    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    // track if user changed the amount
    const [touchedAmount, setTouchedAmount] = useState(false);
    const touchedAmountRef = useRef(false);
    const prevCurrencyRef = useRef(currencyCode);
    const prevPairRateRef = useRef(1);
    const [pairRate, setPairRate] = useState<number>(1);

    // auto-calc suggested full payment in selected currency
    useEffect(() => {
      const forward = getPairRate(currencyCode, outletCurrency);
      const reverse =
        currencyCode === outletCurrency
          ? 1
          : getPairRate(outletCurrency, currencyCode);
      setPairRate(forward);

      const suggested =
        currencyCode === outletCurrency
          ? remaining
          : round4(remaining * reverse);
      const currencyChanged = prevCurrencyRef.current !== currencyCode;

      if (currencyChanged && touchedAmountRef.current) {
        const numeric = Number(amount) || 0;
        const oldRate = prevPairRateRef.current || 1;
        const inOutlet = numeric * oldRate;
        const converted =
          currencyCode === outletCurrency
            ? inOutlet
            : round4(inOutlet * reverse);
        setAmount(
          converted ? Number(round4(converted)).toFixed(2) : ""
        );
      } else if (currencyChanged || !touchedAmountRef.current) {
        setAmount(Number(suggested.toFixed(4)).toFixed(2));
        if (currencyChanged && touchedAmountRef.current) {
          touchedAmountRef.current = false;
          setTouchedAmount(false);
        }
      }

      prevCurrencyRef.current = currencyCode;
      prevPairRateRef.current = forward;
    }, [currencyCode, outletCurrency, remaining, amount]);

    // what this amount becomes in outlet currency
    const approxLocal = useMemo(() => {
      const n = parseFloat(amount || "0");
      if (!Number.isFinite(n)) return "0.00";
      const calculated = n * pairRate;
      // Round to 4 decimals for calculation, then display with 2 decimals
      return round4(calculated).toFixed(2);
    }, [amount, pairRate]);

    const canSubmit =
      !!accountId &&
      Number.isFinite(parseFloat(amount)) &&
      parseFloat(amount) > 0;

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">CASH</div>

        <div className="text-sm mb-2">Account</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        <div className="grid grid-cols-2 gap-3 ">
          <div>
            <div className="text-sm mt-4 mb-2">Currency</div>
            <CurrencySelect
              value={currencyCode}
              onChange={(v) => {
                setCurrencyCode(v);
                // reset so new currency auto-fills again
                touchedAmountRef.current = false;
                setTouchedAmount(false);
                setAmount("");
              }}
            />
          </div>

          <div>
            <div className="text-sm mt-4 mb-2">Amount ({currencyCode})</div>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => {
                touchedAmountRef.current = true;
                setTouchedAmount(true);
                setAmount(e.target.value);
              }}
            />
            <div className="text-xs text-muted-foreground mt-1">
              ≈ {outletCurrency} {approxLocal}
            </div>
          </div>
        </div>

        <Button
          className="mt-5 w-full bg-[#8daaee] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={async () => {
            const num = parseFloat(amount || "0");
            if (!canSubmit) return;

            const rate = getPairRate(currencyCode, outletCurrency); // pay → outlet
            recordPayment({
              method: "cash",
              amount: num, // entered in selected currency
              currencyCode,
              accountId,
              exchangeRate: rate,
            });
            setAmount("");
            touchedAmountRef.current = false;
            setTouchedAmount(false);
          }}
        >
          Record Payment
        </Button>
      </div>
    );
  }

  function GiftVoucherForm() {
    const [code, setCode] = useState("");
    const [amount, setAmount] = useState("");
    const [currencyCode, setCurrencyCode] = useState<string>(
      currencies?.[0]?.currencyCode ?? "LKR"
    );
    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    const [touchedAmount, setTouchedAmount] = useState(false);
    const touchedAmountRef = useRef(false);
    const prevCurrencyRef = useRef(currencyCode);
    const prevPairRateRef = useRef(1);
    const [pairRate, setPairRate] = useState(1);

    useEffect(() => {
      const forward = getPairRate(currencyCode, outletCurrency);
      const reverse =
        currencyCode === outletCurrency
          ? 1
          : getPairRate(outletCurrency, currencyCode);
      setPairRate(forward);

      const suggested =
        currencyCode === outletCurrency
          ? remaining
          : round4(remaining * reverse);
      const currencyChanged = prevCurrencyRef.current !== currencyCode;

      if (currencyChanged && touchedAmountRef.current) {
        const numeric = Number(amount) || 0;
        const oldRate = prevPairRateRef.current || 1;
        const inOutlet = numeric * oldRate;
        const converted =
          currencyCode === outletCurrency
            ? inOutlet
            : round4(inOutlet * reverse);
        setAmount(
          converted ? Number(round4(converted)).toFixed(2) : ""
        );
      } else if (currencyChanged || !touchedAmountRef.current) {
        setAmount(Number(suggested.toFixed(4)).toFixed(2));
        if (currencyChanged && touchedAmountRef.current) {
          touchedAmountRef.current = false;
          setTouchedAmount(false);
        }
      }

      prevCurrencyRef.current = currencyCode;
      prevPairRateRef.current = forward;
    }, [currencyCode, outletCurrency, remaining, amount]);

    const approxLocal = useMemo(() => {
      const n = parseFloat(amount || "0");
      if (!Number.isFinite(n)) return "0.00";
      const calculated = n * pairRate;
      // Round to 4 decimals for calculation, then display with 2 decimals
      return round4(calculated).toFixed(2);
    }, [amount, pairRate]);

    const canSubmit =
      !!code &&
      !!accountId &&
      Number.isFinite(parseFloat(amount)) &&
      parseFloat(amount) > 0;

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">GIFT VOUCHER</div>

        <div className="text-sm mb-2">Account</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        <div className="text-sm mt-4 mb-2">Currency</div>
        <CurrencySelect
          value={currencyCode}
          onChange={(v) => {
            setCurrencyCode(v);
            touchedAmountRef.current = false;
            setTouchedAmount(false);
            setAmount("");
          }}
        />

        <div className="text-sm mt-4 mb-2">Voucher Code</div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Voucher Code"
        />

        <div className="text-sm mt-4 mb-2">Amount ({currencyCode})</div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => {
            touchedAmountRef.current = true;
            setTouchedAmount(true);
            setAmount(e.target.value);
          }}
          placeholder="Amount"
        />
        <div className="text-xs text-muted-foreground mt-1">
          ≈ {outletCurrency} {approxLocal}
        </div>

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={() => {
            const num = parseFloat(amount || "0");
            if (!canSubmit) return;

            recordPayment({
              method: "giftVoucher",
              amount: num, // in selected currency
              currencyCode,
              accountId,
              details: { voucherCode: code },
            });
            setAmount("");
            setCode("");
            touchedAmountRef.current = false;
            setTouchedAmount(false);
          }}
        >
          Record Payment
        </Button>
      </div>
    );
  }

  function CityLedgerForm() {
    const [currencyCode, setCurrencyCode] = useState<string>(
      currencies?.[0]?.currencyCode ?? (outletCurrency || "LKR")
    );

    const [amount, setAmount] = useState("");
    const [touchedAmount, setTouchedAmount] = useState(false);
    const touchedAmountRef = useRef(false);
    const prevCurrencyRef = useRef(currencyCode);
    const prevPairRateRef = useRef(1);
    const [pairRate, setPairRate] = useState(1);

    // ensure some default currency
    useEffect(() => {
      if (!currencyCode && currencies?.length) {
        setCurrencyCode(currencies[0].currencyCode);
      }
    }, [currencies, currencyCode]);

    useEffect(() => {
      if (!currencyCode) return;
      const forward = getPairRate(currencyCode, outletCurrency);
      const reverse =
        currencyCode === outletCurrency
          ? 1
          : getPairRate(outletCurrency, currencyCode);
      setPairRate(forward);

      const suggested =
        currencyCode === outletCurrency
          ? remaining
          : round4(remaining * reverse);
      const currencyChanged = prevCurrencyRef.current !== currencyCode;

      if (currencyChanged && touchedAmountRef.current) {
        const numeric = Number(amount) || 0;
        const oldRate = prevPairRateRef.current || 1;
        const inOutlet = numeric * oldRate;
        const converted =
          currencyCode === outletCurrency
            ? inOutlet
            : round4(inOutlet * reverse);
        setAmount(
          converted ? Number(round4(converted)).toFixed(2) : ""
        );
      } else if (currencyChanged || !touchedAmountRef.current) {
        setAmount(Number(suggested.toFixed(4)).toFixed(2));
        if (currencyChanged && touchedAmountRef.current) {
          touchedAmountRef.current = false;
          setTouchedAmount(false);
        }
      }

      prevCurrencyRef.current = currencyCode;
      prevPairRateRef.current = forward;
    }, [currencyCode, outletCurrency, remaining, amount]);

    const approxLocal = useMemo(() => {
      const n = parseFloat(amount || "0");
      if (!Number.isFinite(n)) return "0.00";
      const calculated = n * pairRate;
      // Round to 4 decimals for calculation, then display with 2 decimals
      return round4(calculated).toFixed(2);
    }, [amount, pairRate]);

    // must have TA selected and positive amount
    const canSubmit =
      !!selectedTravelAgent &&
      remaining > 0 &&
      Number.isFinite(parseFloat(amount)) &&
      parseFloat(amount) > 0;

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">CITY LEDGER</div>

        {/* Travel Agent selector */}
        <div>
          <label className="text-sm font-medium block mb-2">Travel Agent</label>
          <div className="grid grid-cols-1 gap-2">
            <div className="col-span-4">
              <Select
                value={selectedTravelAgent}
                onValueChange={(value) => setSelectedTravelAgent(value)}
              >
                <SelectTrigger id="travelAgent">
                  <SelectValue placeholder="Select Travel Agent" />
                </SelectTrigger>
                <SelectContent>
                  {travelAgentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="text-sm mt-4 mb-2">Currency</div>
        <CurrencySelect
          value={currencyCode}
          onChange={(v) => {
            setCurrencyCode(v);
            touchedAmountRef.current = false;
            setTouchedAmount(false);
            setAmount("");
          }}
        />

        {/* Amount – default full remaining in selected currency, editable */}
        <div className="text-sm mt-4 mb-2">Amount ({currencyCode})</div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => {
            touchedAmountRef.current = true;
            setTouchedAmount(true);
            setAmount(e.target.value);
          }}
          placeholder="Amount"
        />
        <div className="text-xs text-muted-foreground mt-1">
          ≈ {outletCurrency} {approxLocal} (Remaining: {outletCurrency}{" "}
          {Number(remaining.toFixed(4)).toFixed(2)})
        </div>

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={async () => {
            if (!canSubmit) return;
            const num = parseFloat(amount || "0");
            if (!num) return;

            const rate =
              pairRate || getPairRate(currencyCode, outletCurrency);

            recordPayment({
              method: "cityLedger",
              amount: num, // in selected currency
              currencyCode,
              accountId: 1, // 👈 your fixed GL account
              exchangeRate: rate,
              nameId: Number(selectedTravelAgent),
            });
            setAmount("");
            touchedAmountRef.current = false;
            setTouchedAmount(false);
          }}
        >
          Record Payment
        </Button>
      </div>
    );
  }

  const hasRoomPost = useMemo(
    () => payments.some((p) => p.method === "roomPost"),
    [payments]
  );

  function RoomPostForm() {
    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    const canSubmit =
      !!accountId && !!selectedRoom && remaining > 0 && outletCurrency;

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-3">ROOM POST</div>

        {/* 1) GL account */}
        <div className="text-sm mb-2">Account</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        {/* 2) Room grid */}
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-2">
          Choose Room
        </div>

        {allRooms.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No rooms available.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {allRooms.map((r) => {
              const isSel =
                selectedRoom?.reservationDetailID === r.reservationDetailID;
              return (
                <button
                  key={r.reservationDetailID}
                  type="button"
                  onClick={() =>
                    setSelectedRoom({
                      reservationID: r.reservationID,
                      reservationDetailID: r.reservationDetailID,
                      roomID: r.roomID,
                      roomNumber: r.roomNumber,
                    })
                  }
                  className={[
                    "relative aspect-square rounded-xl border",
                    "flex items-center justify-center",
                    "bg-white dark:bg-neutral-900 hover:bg-muted/30 transition",
                    isSel ? "ring-2 ring-[#224FB6]" : "",
                  ].join(" ")}
                  aria-pressed={isSel}
                  title={`Room ${r.roomNumber}`}
                >
                  <span
                    className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: r.statusColor }}
                  />
                  <span className="text-sm font-semibold">{r.roomNumber}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 text-xs text-muted-foreground">
          {selectedRoom ? (
            <>
              Selected:{" "}
              <span className="font-medium">
                Room {selectedRoom.roomNumber}
              </span>
            </>
          ) : (
            <>Pick one room to post the bill.</>
          )}
        </div>

        {/* 3) Amount & currency (auto, read-only) */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <div className="text-sm mb-2">Currency</div>
            <Input value={outletCurrency} disabled />
          </div>
          <div>
            <div className="text-sm mb-2">Amount</div>
            <Input value={Number(remaining.toFixed(4)).toFixed(2)} disabled />
          </div>
        </div>

        {/* 4) Add as payment */}
        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={() => {
            // Add a payment line equal to the remaining, in POS center currency
            recordPayment({
              method: "roomPost",
              amount: remaining, // foreign amount = local (FX 1:1)
              currencyCode: outletCurrency,
              accountId,
              exchangeRate: 1, // POS currency -> local currency (same)
              // keep the selectedRoom in component state for submit()
            });
          }}
        >
          Record Room Post
        </Button>

        {/* tip */}
        <div className="text-[11px] mt-2 text-muted-foreground">
          Adds a Room Post payment for the remaining balance in {outletCurrency}
          .
        </div>
      </div>
    );
  }

  function ComplimentaryForm() {
    const [amount, setAmount] = useState(Number(remaining.toFixed(4)).toFixed(2)); // default to remaining
    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    useEffect(() => {
      // keep default aligned with "remaining" until user edits
      setAmount(Number(remaining.toFixed(4)).toFixed(2));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining]);

    const canSubmit =
      !!accountId &&
      Number.isFinite(parseFloat(amount)) &&
      parseFloat(amount) > 0;

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">COMPLIMENTARY</div>

        <div className="text-sm mb-2">Expense/Adjustment GL</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        <div className="text-sm mt-4 mb-2">Amount ({outletCurrency})</div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />

        <div className="text-xs text-muted-foreground mt-2">
          This will settle by debiting the selected GL (complimentary expense).
        </div>

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={() => {
            const num = parseFloat(amount || "0");
            if (!num || !accountId) return;
            // Complimentary is in outlet currency; store as such
            recordPayment({
              method: "complimentary",
              amount: num, // foreign
              currencyCode: outletCurrency,
              accountId,
              exchangeRate: 1,
            });
            setAmount("");
          }}
        >
          Record Complimentary
        </Button>
      </div>
    );
  }

  function CardForm() {
    const [brand, setBrand] = useState<CardBrandKey>("visa");
    const [last4, setLast4] = useState("");
    const [currencyCode, setCurrencyCode] = useState<string>(
      currencies?.[0]?.currencyCode ?? "LKR"
    );
    const [amount, setAmount] = useState("");

    const [touchedAmount, setTouchedAmount] = useState(false);
    const touchedAmountRef = useRef(false);
    const prevCurrencyRef = useRef(currencyCode);
    const [pairRate, setPairRate] = useState(1);

    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    const meta = brandMeta(brand);

    useEffect(() => {
      const forward = getPairRate(currencyCode, outletCurrency);
      const reverse =
        currencyCode === outletCurrency
          ? 1
          : getPairRate(outletCurrency, currencyCode);
      setPairRate(forward);

      const suggested =
        currencyCode === outletCurrency
          ? remaining
          : round4(remaining * reverse);
      const currencyChanged = prevCurrencyRef.current !== currencyCode;

      if (currencyChanged || !touchedAmountRef.current) {
        setAmount(Number(suggested.toFixed(4)).toFixed(2));
        if (currencyChanged && touchedAmountRef.current) {
          touchedAmountRef.current = false;
          setTouchedAmount(false);
        }
      }

      prevCurrencyRef.current = currencyCode;
    }, [currencyCode, outletCurrency, remaining]);

    const approxLocal = useMemo(() => {
      const n = parseFloat(amount || "0");
      if (!Number.isFinite(n)) return "0.00";
      const calculated = n * pairRate;
      // Round to 4 decimals for calculation, then display with 2 decimals
      return round4(calculated).toFixed(2);
    }, [amount, pairRate]);

    const canSubmit =
      !!accountId &&
      Number.isFinite(parseFloat(amount)) &&
      parseFloat(amount) > 0 &&
      last4.length === 4;

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">CARD</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm">Card Type</div>
            <Select
              value={brand}
              onValueChange={(v) => setBrand(v as CardBrandKey)}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select Card Type" />
              </SelectTrigger>
              <SelectContent>
                {CARD_BRANDS.map((b) => (
                  <SelectItem key={b.key} value={b.key}>
                    <div className="flex items-center gap-2">
                      <img src={b.img} alt={b.label} className="h-4 w-auto" />
                      <span>{b.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm">Account</div>
            <GLAccountSelect value={accountId} onChange={setAccountId} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 items-start pt-2">
          {/* Last 4 digits */}
          <div className="space-y-2">
            <div className="text-sm">Enter Last 4 Digits</div>
            <Input
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              className="h-10 tracking-widest"
              value={last4}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                setLast4(digits);
              }}
              onKeyDown={(e) => {
                const ok =
                  /[0-9]/.test(e.key) ||
                  [
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                  ].includes(e.key);
                if (!ok) e.preventDefault();
              }}
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <div className="text-sm">Currency</div>
            <CurrencySelect
              value={currencyCode}
              onChange={(v) => {
                setCurrencyCode(v);
                touchedAmountRef.current = false;
                setTouchedAmount(false);
                setAmount("");
              }}
              className="h-10"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="text-sm">Amount ({currencyCode})</div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                touchedAmountRef.current = true;
                setTouchedAmount(true);
                setAmount(e.target.value);
              }}
              placeholder="Amount"
              className="h-10"
            />
            <div className="text-xs text-muted-foreground mt-1">
              ≈ {outletCurrency} {approxLocal}
            </div>
          </div>
        </div>

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={async () => {
            const num = parseFloat(amount || "0");
            if (!canSubmit) return;
            const rate =
              pairRate || getPairRate(currencyCode, outletCurrency);

            recordPayment({
              method: "card",
              amount: num, // in selected currency
              currencyCode,
              accountId,
              exchangeRate: rate,
              details: { cardType: brand.toUpperCase(), cardNo: last4 },
            });
            setAmount("");
            setLast4("");
            touchedAmountRef.current = false;
            setTouchedAmount(false);
          }}
        >
          Record Payment
        </Button>
      </div>
    );
  }

  // ---- Tile grid (your first screenshot style)
  // === REPLACE the whole `tiles` array ===
  const tiles: {
    key: PaymentMethod;
    label: string;
    icon: JSX.Element;
  }[] = [
      { key: "cash", label: "Cash", icon: <DollarSign className="w-5 h-5" /> },
      { key: "card", label: "Card", icon: <CreditCard className="w-5 h-5" /> },
      {
        key: "bankTransfer",
        label: "Online Banking",
        icon: <Banknote className="w-5 h-5" />,
      },
      { key: "check", label: "Check", icon: <CheckSquare className="w-5 h-5" /> },
      {
        key: "cityLedger",
        label: "City Ledger",
        icon: <BookOpenCheck className="w-5 h-5" />,
      },
      {
        key: "giftVoucher",
        label: "Gift Voucher",
        icon: <Gift className="w-5 h-5" />,
      }, // maps to your voucher/credit
      {
        key: "roomPost",
        label: "Room Post",
        icon: <Bed className="w-5 h-5" />,
      },
      {
        key: "complimentary",
        label: "Complimentary",
        icon: <Gift className="w-5 h-5" />,
      },
    ];

  const emailLooksValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim()),
    [emailTo]
  );

  useEffect(() => {
    if (emailLast?.success && postActionsOpen) {
      finishAndCleanup();
    }
  }, [emailLast?.success, postActionsOpen]);

  const [action, setAction] = useState<"print" | "email">("print");

  // Normalize details.cardType (e.g., "VISA" | "MASTER" | "AMEX") -> brand key
  const cardKeyFromDetails = (t?: string) => {
    const v = (t || "").toLowerCase();
    if (v.startsWith("vis")) return "visa";
    if (v.startsWith("mas")) return "master";
    if (v.startsWith("ame")) return "amex";
    return undefined;
  };

  // Find brand meta from details.cardType
  const brandFromDetails = (t?: string) => {
    const key = cardKeyFromDetails(t);
    return key ? CARD_BRANDS.find((b) => b.key === key) : undefined;
  };

  // Mask for recorded list
  const maskRecorded = (last4?: string) =>
    `****** ********** ${last4 ?? "____"}`;

  function buildEmailHtmlFromSnapshot() {
    if (!postedSnap) return "<html><body>Receipt not available.</body></html>";

    const {
      docNo,
      cart: snapCart,
      payments: snapPays,
      grand: snapGrand,
      tax: snapTax,
      deliveryDetails: snapDelivery,
      selectedProperty: snapProp,
    } = postedSnap;

    const receiptLines = snapCart.map((it) => {
      const code = (it as any).itemCode || (it as any).code || it.id || "";
      const label = code ? `${code} - ${it.name || "Item"}` : it.name || "Item";

      return {
        itemDescription: label,
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        lineTotal: round2(Number(
          (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(4)
        )),
      };
    });

    const paymentsForHtml = snapPays.map((p) => ({
      label: p.method ? p.method.toUpperCase() : "PAYMENT",
      foreignAmount:
        typeof p.amount === "number" ? Number(p.amount) : undefined,
      foreignCurrency: p.currencyCode || outletCurrency || "",
      localAmount: Number(p.amountLocal || 0),
      localCurrency: outletCurrency || "",
    }));

    return buildReceiptEmailHtml({
      hotelName:
        snapProp?.name || snapProp?.hotelName || snapProp?.hotelCode || "Hotel",
      docNo,
      dateISO: new Date().toISOString(),
      tableNo: snapDelivery?.tableNo,
      roomNo: snapDelivery?.roomNo,
      cashier: fullName || "POS", // ⬅️ cashier
      posCenterName: outletName, // ⬅️ optional: add in builder
      items: receiptLines,
      subtotal: Number(subTotalLocal.toFixed(2)),
      taxes: toReceiptTaxList(taxLines),
      grand: Number(grand.toFixed(2)),
      payments: paymentsForHtml,
      footerNote: `POS Center: ${outletName} • Cashier: ${fullName || "POS"
        } • Powered by HotelMate`,
    });
  }

  async function handleSendEmail() {
    const html = buildEmailHtmlFromSnapshot();
    await (dispatch as any)(
      sendCustomEmail({
        toEmail: emailTo.trim(),
        subject: emailSubject || `Receipt ${lastDocNo}`,
        body: html,
        isHtml: true,
      })
    );
  }

  function finishAndCleanup() {
    // now it’s safe to clear and close
    dispatch(setPayments([]));
    dispatch(setSelectedForm(null));
    dispatch(closePayment());
    onComplete?.();
    setPostedSnap(null);
    setPostActionsOpen(false);
    setIsRoomPost(false);
  }

  return (
    <div className="space-y-2">
      {/* Total / Paid / Remaining */}
      <div className="flex gap-2">
        {/* <Button variant="outline" onClick={() => dispatch(closePayment())}>
          Add more items
        </Button> */}
        {/* <Button
          className="ml-auto mt-2"
          disabled={
            submitting ||
            remaining > 0 ||
            payments.length === 0 ||
            !invoiceAccountId
          }
          onClick={submit}
        >
          {submitting ? "Posting..." : "Complete Payment"}
        </Button> */}
      </div>
      {payments.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Recorded Payments</div>

          <div className="rounded-md border overflow-hidden">
            <Table className="text-xs [&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1.5 [&_tr]:h-8">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Method</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Foreign</TableHead>
                  <TableHead className="text-right">
                    Local ({outletCurrency})
                  </TableHead>

                  <TableHead className="w-[60px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {payments.map((p, idx) => {
                  const masked =
                    p.method === "card"
                      ? `**** **** **** ${p.details?.cardNo ?? "____"}`
                      : null;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="uppercase font-semibold">
                        {p.method}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {masked ??
                          p.details?.voucherCode ??
                          p.details?.note ??
                          "-"}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {p.currencyCode} {Number(p.amount).toFixed(2)}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {Number(p.amountLocal).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removePayment(idx)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total {outletCurrency}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {totalPaidLocal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${isFullyPaid
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {isFullyPaid
                        ? "Paid in full"
                        : `Remaining: ${remaining.toFixed(2)}`}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-1 dark:bg-black">
        <div className="font-semibold">
          Total: {outletCurrency} {grand.toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground">
          Paid: {totalPaidLocal.toFixed(2)} &nbsp;|&nbsp; Remaining:{" "}
          {remaining.toFixed(2)}
        </div>
      </div>

      {/* <InvoiceGLPicker /> */}

      {/* Method tiles */}
      <div className="bg-[#F7F8FA] dark:bg-neutral-900 p-2 rounded-xl border ">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 py-2">
          Payment Method
        </div>

        <div className="grid grid-cols-3 gap-2 bg-transparent ">
          {tiles.map(({ key, label, icon }) => {
            const selectable = [
              "cash",
              "card",
              "bankTransfer",
              "check",
              "cityLedger",
              "giftVoucher",
              "roomPost",
              "complimentary",
            ].includes(key);
            const isSelected = selectedForm === key;

            return (
              <button
                key={key}
                type="button"
                className={tileBase}
                data-sel={isSelected ? "true" : undefined}
                onClick={() => selectable && toggleForm(key as PaymentMethod)}
                aria-pressed={isSelected}
              >
                <div className="shrink-0 w-9 h-9 grid place-items-center rounded-md border">
                  {icon}
                </div>
                <div className="text-[14px] font-medium">{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Forms grid (like your second screenshot layout) */}
      {selectedForm && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 dark:bg-black">
          {selectedForm === "cash" && <CashForm />}
          {selectedForm === "giftVoucher" && <GiftVoucherForm />}
          {selectedForm === "cityLedger" && <CityLedgerForm />}
          {selectedForm === "card" && <CardForm />}
          {selectedForm === "roomPost" && <RoomPostForm />}
          {selectedForm === "complimentary" && <ComplimentaryForm />}
        </div>
      )}

      {/* Recorded payments list */}

      {/* Complete */}
      {isFullyPaid && (
        <Button
          className="w-full"
          disabled={submitting || payments.length === 0}
          onClick={submit}
        >
          {submitting ? "Posting..." : "Complete Payment"}
        </Button>
      )}

      <PostActionsSheet
        open={postActionsOpen}
        html={printHtml}
        emailTo={emailTo}
        setEmailTo={setEmailTo}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        emailErr={emailErr}
        emailSending={emailSending}
        emailLast={emailLast}
        onSendEmail={handleSendEmail}
        onClose={() => {
          setPostActionsOpen(false);
          // if you want to finish & clear on close:
          finishAndCleanup();
        }}
      />
    </div>
  );
}

function PostActionsSheet({
  open,
  html,
  emailTo,
  setEmailTo,
  emailSubject,
  setEmailSubject,
  emailErr,
  emailSending,
  emailLast,
  onSendEmail,
  onClose,
}: {
  open: boolean;
  html: string;
  emailTo: string;
  setEmailTo: (v: string) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailErr?: string | null;
  emailSending: boolean;
  emailLast?: any;
  onSendEmail: () => void;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [tab, setTab] = useState<"print" | "email">("print");
  const [readyToPrint, setReadyToPrint] = useState(false);
  const [printAttempted, setPrintAttempted] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // reset readiness whenever the html changes or the sheet reopens
  useEffect(() => {
    if (open) {
      setReadyToPrint(false);
      setPrintAttempted(false);
      setCanClose(false);
    }
  }, [open, html]);

  const emailLooksValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((emailTo || "").trim()),
    [emailTo]
  );

  function safeHtml(s: string) {
    // strip any script tags just in case
    return s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }

  const doPrint = useCallback(() => {
    if (!readyToPrint) return; // make sure iframe finished loading

    const iframe = iframeRef.current;
    if (!iframe) return;

    const win = iframe.contentWindow;
    if (!win) return;

    try {
      win.focus();
      win.print(); // will use the iframe content and open browser print dialog
      setPrintAttempted(true);
      setCanClose(true); // Allow closing after print dialog is opened
    } catch (err) {
      console.error("Iframe print failed:", err);
      setPrintAttempted(true);
      setCanClose(true); // Allow closing even if print fails
    }
  }, [readyToPrint]);

  // Auto-trigger print when iframe is ready and sheet is open
  useEffect(() => {
    if (open && readyToPrint && !printAttempted && tab === "print") {
      // Small delay to ensure iframe is fully rendered
      const timer = setTimeout(() => {
        doPrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, readyToPrint, printAttempted, tab, doPrint]);

  const handleClose = () => {
    if (!canClose) {
      // Prevent closing - user must print first
      return;
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && canClose) {
          onClose();
        }
        // If trying to close without printing, prevent it (Sheet will stay open)
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[720px] max-h-[100dvh] p-0 flex flex-col"
      >
        <div className="px-4 py-3 border-b">
          <SheetHeader>
            <SheetTitle>Receipt</SheetTitle>
            {!canClose && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Please print the bill before closing
              </p>
            )}
          </SheetHeader>
        </div>

        {/* Tabs header */}
        <div className="px-4 pt-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="print">Print</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            {/* PRINT TAB */}
            <TabsContent value="print" className="mt-3">
              <div className="border rounded-lg overflow-hidden h-[70vh]">
                <iframe
                  ref={iframeRef}
                  title="Receipt Preview"
                  // allow-modals is required for window.print() in sandbox
                  sandbox="allow-same-origin allow-modals"
                  srcDoc={safeHtml(html)}
                  className="w-full h-full bg-white"
                  onLoad={() => setReadyToPrint(true)}
                />
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Tip: set paper width to 80mm in the print dialog.
              </div>

              {!printAttempted && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ Please print the bill before closing. The print dialog will open automatically.
                </div>
              )}

              <div className="mt-3">
                <Button
                  onClick={doPrint}
                  className="w-full"
                  disabled={!readyToPrint}
                  title={!readyToPrint ? "Preparing preview…" : "Print"}
                >
                  {readyToPrint ? "Print" : "Preparing…"}
                </Button>
              </div>
            </TabsContent>

            {/* EMAIL TAB */}
            <TabsContent value="email" className="mt-3">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">To</Label>
                  <Input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="guest@example.com"
                    type="email"
                  />
                </div>

                <div>
                  <Label className="text-sm">Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Receipt"
                  />
                </div>

                <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
                  The email will include the receipt content below as HTML.
                </div>

                <div className="border rounded-lg overflow-hidden h-[46vh]">
                  <iframe
                    title="Email Preview"
                    sandbox="allow-same-origin"
                    srcDoc={safeHtml(html)}
                    className="w-full h-full bg-white"
                  />
                </div>

                {emailErr && (
                  <div className="text-xs text-red-600">{emailErr}</div>
                )}
                {emailLast?.success && (
                  <div className="text-xs text-green-600">
                    Email sent successfully.
                  </div>
                )}

                <Button
                  onClick={onSendEmail}
                  className="w-full"
                  disabled={!emailLooksValid || emailSending}
                >
                  {emailSending ? "Sending…" : "Send Email"}
                </Button>

                {!emailLooksValid && (
                  <div className="text-[11px] text-amber-600">
                    Enter a valid email address.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 mt-auto border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClose}
            disabled={!canClose}
          >
            {canClose ? "Close" : "Please print the bill first"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
