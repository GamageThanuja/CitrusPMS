"use client";

import { JSX, useEffect, useMemo, useState } from "react";
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
import { createPosOrder } from "@/redux/slices/posOrderSlice";
import { createPosInvoice } from "@/redux/slices/createPosInvoiceSlice";
import { fetchHotelCurrencies } from "@/redux/slices/hotelCurrencySlice";
import {
  fetchCurrencies,
  selectCurrencies,
  selectCurrencyLoading,
  selectCurrencyError,
} from "@/redux/slices/currencySlice";
import { RootState } from "@/redux/store";
import { setPayments, setSelectedForm } from "@/redux/slices/checkoutFlowSlice";
import { closePayment, openPayment } from "@/redux/slices/checkoutFlowSlice";
import {
  fetchGlAccounts,
  selectGlAccountList,
  selectGlAccountListLoading,
  selectGlAccountListError,
} from "@/redux/slices/glAccountSlice";
import { fetchHotelPosCenterTaxConfig } from "@/redux/slices/fetchHotelPosCenterTaxConfigSlice";
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
import { fetchExchangeRate } from "@/redux/slices/currencyExchangeSlice";

import { fetchReservations } from "@/redux/slices/fetchReservationsSlice";
import { selectReservations } from "@/redux/slices/fetchReservationsSlice";

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
}

type PosCenterTaxCfg = {
  recordId: number;
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string; // e.g., "CITY TAX", "SERVICE CHARGE", "GST"
  percentage: number; // 0-100
  calcBasedOn: string; // e.g., "base", "subtotal1", "subtotal2"
  accountId?: number; // GL to credit
};

type TaxLine = {
  name: string; // taxName
  pct: number; // percentage
  basedOn: string; // calcBasedOn
  accountId?: number;
  amount: number; // computed (local/outlet currency)
};

type TaxTotals = {
  lines: TaxLine[];
  taxTotal: number; // sum(lines.amount)
  subTotal: number; // sum(cart)
  grand: number; // subTotal + taxTotal
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
  tranMasId,
  tax,
}: PaymentMethodSelectionProps) {
  const dispatch = useDispatch();
  const currencies = useSelector(selectCurrencies);
  const currencyLoading = useSelector(selectCurrencyLoading);
  const currencyError = useSelector(selectCurrencyError);
  const loadedOnce = useSelector((s: any) => s.currency?.loadedOnce);

  console.log("cart : ", cart);
  console.log("tranMasId : ", tranMasId);
  console.log("tax : ", tax);
  console.log("posCenter : ", cart);

  const glAccounts = useSelector(selectGlAccountList);
  const glLoading = useSelector(selectGlAccountListLoading);
  const glError = useSelector(selectGlAccountListError);

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

  const reservations = useSelector(selectReservations);

  // which reservation & which room tile user chose
  const [selectedReservationId, setSelectedReservationId] = useState<
    number | null
  >(null);
  const [selectedRoom, setSelectedRoom] = useState<{
    reservationDetailID: number;
    roomID: number;
    roomNumber: string;
  } | null>(null);

  const round2 = (n: number) => Number((n ?? 0).toFixed(2));

  // ADD: read POS tax config state
  const posTaxConfig = useSelector(
    (s: RootState) => s.fetchHotelPosCenterTaxConfig?.data ?? []
  );
  const posTaxConfigStatus = useSelector(
    (s: RootState) => s.fetchHotelPosCenterTaxConfig?.status
  );
  const posTaxConfigError = useSelector(
    (s: RootState) => s.fetchHotelPosCenterTaxConfig?.error
  );

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

  const outletInfo: LSOutlet = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_OUTLET_OBJ) || "{}");
    } catch {
      return {};
    }
  }, []);

  const outletName =
    outletInfo.posCenter || String(posCenter || "DefaultPOSCenter");
  const outletId = Number(
    outletInfo.hotelPosCenterId ?? (Number(posCenter) || 0)
  );

  const taxTotals = useMemo(() => {
    // compute using items in the *current* cart
    return computeTaxesFromConfig(
      (posTaxConfig as PosCenterTaxCfg[]) ?? [],
      cart ?? []
    );
  }, [posTaxConfig, cart]);

  // Use these everywhere instead of the old hard-coded 'tax' prop:
  const subTotalLocal = taxTotals.subTotal;
  const taxLines = taxTotals.lines; // [{ name, pct, amount, accountId }, ...]
  const taxTotalLocal = taxTotals.taxTotal;

  useEffect(() => {
    const id = Number(posCenter) || 0;
    if (id > 0) {
      (dispatch as any)(fetchHotelPosCenterTaxConfig(id));
    }
  }, [dispatch, posCenter]);

  function computeTaxesFromConfig(
    cfgs: PosCenterTaxCfg[] = [],
    cart: { price: number; quantity: number }[]
  ): TaxTotals {
    const subTotal = round2(
      (cart ?? []).reduce(
        (t, it) => t + Number(it.price || 0) * Number(it.quantity || 0),
        0
      )
    );

    let running = subTotal; // current base for "subtotalX" taxes
    const lines: TaxLine[] = [];

    for (const c of cfgs ?? []) {
      const name = (c.taxName || "").trim();
      const pct = Number(c.percentage || 0);
      const based = (c.calcBasedOn || "base").toLowerCase();

      // decide base:
      const base =
        based === "base"
          ? subTotal
          : based.startsWith("subtotal")
          ? running
          : subTotal; // fallback

      const amount = round2(base * (pct / 100));
      lines.push({
        name,
        pct,
        basedOn: based,
        accountId: c.accountId,
        amount,
      });

      // If this tax contributes to the next "subtotal" stage, include it
      if (based.startsWith("subtotal")) {
        running = round2(running + amount);
      }
    }

    const taxTotal = round2(lines.reduce((t, x) => t + x.amount, 0));
    const grand = round2(subTotal + taxTotal);

    return { lines, taxTotal, subTotal, grand };
  }

  console.log("posTaxConfig : ", posTaxConfig);

  const allRooms = useMemo(() => {
    const list =
      (reservations ?? []).flatMap((r) =>
        (r.rooms ?? []).map((rm) => ({
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
  const getRate = (c: any | null) => {
    if (!c) return 1;
    if (typeof c.exchangeRate === "number" && isFinite(c.exchangeRate))
      return c.exchangeRate || 1;
    return c.currencyCode === "LKR" ? 1 : 1;
  };

  const selectedProperty = useMemo(
    () => JSON.parse(localStorage.getItem("selectedProperty") || "{}"),
    []
  );
  const hotelId = selectedProperty?.hotelId ?? selectedProperty?.id ?? 0;

  // fetch once
  useEffect(() => {
    (dispatch as any)(fetchGlAccounts());
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

  const grand = useMemo(
    () => Number(taxTotals.grand.toFixed(2)),
    [taxTotals.grand]
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

    const receiptLines = snapCart.map((it) => ({
      itemDescription: it.name || "Item",
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
      lineTotal: Number(
        (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)
      ),
    }));

    const paymentsForPrint = snapPays.map((p) => ({
      label: `${p.method.toUpperCase()} (${p.currencyCode})`,
      foreignAmount: Number(p.amount || 0),
      localAmount: Number(p.amountLocal || 0),
    }));

    return buildPOSReceipt80mmHtml({
      hotelName: snapProp?.hotelName || snapProp?.hotelCode || "HotelMate POS",
      docNo,
      dateISO: new Date().toISOString(),
      tableNo: snapDelivery?.tableNo,
      roomNo: snapDelivery?.roomNo,
      cashier: "POS",
      items: receiptLines,
      subtotal: Number(subTotalLocal.toFixed(2)),
      // pass array if your template supports listing, or
      // if it expects an object, you can convert like:
      taxes: toReceiptTaxList(taxLines), // ← dynamic: [{label, amount}, ...]
      grand: Number(taxTotals.grand.toFixed(2)),
      payments: paymentsForPrint,
      footerNote: "Thank you for your business.",
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
    // If you want to always refresh, drop the loadedOnce guard.
    if (!loadedOnce) {
      (dispatch as any)(fetchCurrencies());
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
    const local = Number((entry.amount * rate).toFixed(2));

    // Cap by remaining (in local)
    const allowedLocal = Math.min(local, remaining);
    if (allowedLocal <= 0) return;

    // If we capped, recompute foreign back so the line stays consistent
    const adjustedForeign = Number((allowedLocal / rate).toFixed(2));

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
      (dispatch as any)(
        fetchReservations({
          reservationStatusId: 4,
          page: 1,
          pageSize: 50, // tweak if needed
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
    let excess = Number((paidLocal - grand).toFixed(2));

    // trim from the tail
    for (let i = next.length - 1; i >= 0 && excess > 0; i--) {
      const cutLocal = Math.min(next[i].amountLocal, excess);
      const prevLocal = next[i].amountLocal;
      const newLocal = Number((prevLocal - cutLocal).toFixed(2));

      if (newLocal <= eps) {
        // remove whole line
        excess = Number((excess - prevLocal).toFixed(2));
        next.splice(i, 1);
      } else {
        const ratio = newLocal / prevLocal; // keep FX ratio
        next[i].amountLocal = newLocal;
        next[i].amount = Number((next[i].amount * ratio).toFixed(2));
        excess = Number((excess - cutLocal).toFixed(2));
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
      payments.reduce(
        (t, p) => t + (Number.isFinite(p.amountLocal) ? p.amountLocal : 0),
        0
      ),
    [payments]
  );
  const remaining = Math.max(0, Number((grand - totalPaidLocal).toFixed(2)));

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
      (async () => {
        const rate = await getPairRate(currencyCode, outletCurrency);
        setPairRate(rate);
      })();
    }, [currencyCode, outletCurrency]);

    const approx = (() => {
      const n = Number(amount);
      return Number.isFinite(n) ? (n * pairRate).toFixed(2) : "0.00";
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

  const getPairRate = async (baseCurrency: string, targetCurrency: string) => {
    if (!baseCurrency || !targetCurrency || baseCurrency === targetCurrency)
      return 1;
    try {
      const r = await (dispatch as any)(
        fetchExchangeRate({ baseCurrency, targetCurrency })
      ).unwrap();
      const n = Number(r);
      return Number.isFinite(n) && n > 0 ? n : 1;
    } catch {
      return 1;
    }
  };

  function toReceiptTaxList(lines: TaxLine[]) {
    return lines.map((l) => ({
      label: `${l.name} (${round2(l.pct)}%)`,
      amount: round2(l.amount),
    }));
  }

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      const docNo = `DOC-${Date.now()}`;

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelCode = selectedProperty?.hotelCode || "DEFAULT_CODE";
      const propertyID = Number(
        selectedProperty?.hotelId || selectedProperty?.id || 0
      );

      const tableNo = deliveryDetails.tableNo || "string";
      const noOfPax = deliveryDetails.noOfPax
        ? Number(deliveryDetails.noOfPax)
        : 0;
      const roomId = deliveryDetails.roomNo
        ? Number(deliveryDetails.roomNo)
        : 0;

      // Totals (LOCAL)
      const grossLocal = Number(grand.toFixed(2)); // ✅ grand
      const paidLocal = Number(
        payments.reduce((t, p) => t + (p.amountLocal || 0), 0).toFixed(2)
      );
      const remainingLocal = Number((grossLocal - paidLocal).toFixed(2));

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
        createdBy: "POS",
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
        currencyCode: outletCurrency,
        currCode: outletCurrency,
        convRate: "1",
        cardType: "string",
        reservationDetailID: useReservationDetailId,
        ...overrides,
      });

      // Amounts must be positive; debit/credit decide the side
      const mkDebit = (base: any, valLocal: number, valForeign?: number) => {
        const amt = Math.abs(Number(valLocal.toFixed(2)));
        const f =
          valForeign != null ? Math.abs(Number(valForeign.toFixed(2))) : amt;
        return {
          ...base,
          amount: amt, // ← positive
          debit: amt,
          credit: 0,
          currAmount: f, // ← positive
          currDebit: f,
          currCredit: 0,
        };
      };

      const mkCredit = (base: any, valLocal: number, valForeign?: number) => {
        const amt = Math.abs(Number(valLocal.toFixed(2)));
        const f =
          valForeign != null ? Math.abs(Number(valForeign.toFixed(2))) : amt;
        return {
          ...base,
          amount: -amt, // ← negative for credits
          debit: 0,
          credit: amt, // ← credit column stays positive
          currAmount: -f, // ← negative for credits (foreign)
          currDebit: 0,
          currCredit: f,
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
        grossLocal
      );

      // ---- 2) CR Sales PER-ITEM (your requirement)
      const salesCreditLines = (cart as CartItemWithSales[])
        .map((item) => {
          const accountID = getSalesAcc(item) || 7; // per-item sales account (fallback 7)
          const itemIdNum = getItemId(item);
          const lineLocal = Number(
            (Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)
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
      const paymentCashDebits = payments
        .map((p) => {
          const local = Number((p.amountLocal || 0).toFixed(2));
          if (!local) return null;
          const foreign = Number((p.amount || 0).toFixed(2));
          const rate = p.exchangeRate ?? 1;
          const currency = p.currencyCode || "LKR";

          return mkDebit(
            mkBase(
              {
                accountID: Number(p.accountId || 0),
                comment:
                  (p.method || "").toUpperCase() +
                  (p.details?.voucherCode
                    ? ` • ${p.details.voucherCode}`
                    : "") +
                  (p.details?.cardNo ? ` • ${p.details.cardNo}` : ""),
                memo: "POS payment",
                currencyCode: currency,
                currCode: currency,
                convRate: String(rate || 1),
                cardType: p.details?.cardType || "string",
              },
              TRAN_TYPE_PAYMENT
            ),
            local,
            foreign
          );
        })
        .filter(Boolean) as any[];

      // ---- 4) CR A/R for amount paid (settlement on this invoice)
      const customerCreditForPaid =
        paidLocal > 0
          ? mkCredit(
              mkBase(
                {
                  accountID: Number(2),
                  comment: "POS A/R Settlement (on invoice)",
                  memo: "Reduce A/R by payments",
                  isDue: remainingLocal > 0,
                },
                TRAN_TYPE_PAYMENT
              ),
              paidLocal
            )
          : null;

      const taxCreditLines = (taxLines || [])
        .map((line) => {
          const localAmt = Number((line.amount || 0).toFixed(2));
          const accId = Number(line.accountId || 0);
          if (!accId || localAmt <= 0) return null;

          return mkCredit(
            mkBase(
              {
                accountID: accId,
                comment: line.name, // e.g., "GST", "SERVICE CHARGE", "CITY TAX"
                memo: "POS tax",
              },
              TRAN_TYPE_INVOICE
            ),
            localAmt
          );
        })
        .filter(Boolean) as any[];

      // ---- Final GL batch (no zeros; all Amounts positive)
      const glAccTransactions = [
        arDebitOpen, // DR A/R
        ...salesCreditLines, // CR Sales (one per item)
        ...taxCreditLines,
        ...paymentCashDebits, // DR Cash/Bank/Card
        ...(customerCreditForPaid ? [customerCreditForPaid] : []), // CR A/R settlement
      ].filter(
        (l) => Number(l.accountID) > 0 && Math.abs(Number(l.amount)) > 0
      );

      // if Room Post, override the IDs from the user's selection

      const payload = {
        glAccTransactions,
        tranMasId: Number(tranMasId || 0),
        posCenter: String(posCenter || "string"),
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
        tranValue: grossLocal,
        nameId: 0,
        chequeNo: "string",
        paymentMethod: payments.map((l) => l.method?.toUpperCase()).join(", "),
        chequeDate: now,
        exchangeRate: 1,
        debit: 0,
        amount: grossLocal,
        comment: "string",
        createdBy: "POS",
        currAmount: grossLocal,
        currencyCode: outletCurrency,
        convRate: "1",
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
        isTaxApplied: true,
        serviceChargeAmount: Math.round(tax?.sc ?? 0),
        tdlTaxAmount: Math.round(tax?.tdl ?? 0),
        ssclTaxAmount: Math.round(tax?.sscl ?? 0),
        vatTaxAmount: Math.round(tax?.vat ?? 0),

        // keep IDs if you have them; otherwise 0
        serviceChargeId: 0,
        tdlTaxId: 0,
        ssclTaxId: 0,
        vatTaxId: 0,
      };

      console.log("payload (json):\n" + JSON.stringify(payload, null, 2));

      {
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
          posCenter: String(outletName || "DefaultPOSCenter"),
          accountIdDebit: 0,
          accountIdCredit: 0,
          hotelCode: String(selectedProperty?.hotelCode || "DEFAULT_CODE"),
          finAct: false,

          tranTypeId: 75, // HOLD/KOT
          tranDate: orderNow,
          effectiveDate: orderNow,
          docNo: orderDocNo,
          createdOn: orderNow,
          tranValue: grossLocal, // use computed grand (subtotal + API-config taxes)
          nameId: 0,
          chequeNo: "",
          paymentMethod: orderPayMethod,
          chequeDate: orderNow,
          exchangeRate: 1,
          debit: 0,
          amount: grossLocal,
          comment: "Auto-generated POS Order",
          createdBy: "POS",
          currAmount: grossLocal,
          currencyCode: outletCurrency || "LKR",
          convRate: "1",
          credit: 0,
          paymentReceiptRef: "N/A",
          remarks: "Generated by POS checkout",
          dueDate: orderNow,
          refInvNo: `REF-${Date.now()}`,
          tableNo: orderTableNo,
          isFinished: false,
          discPercentage: 0,
          onCost: false,
          startTimeStamp: orderNow,
          endTimeStamp: orderNow,

          // Context by delivery method
          roomId: orderRoomId || 0,
          noOfPax: Number(deliveryDetails.noOfPax || 1),
          deliveryMethod: deliveryMethod || "string",
          phoneNo: String(deliveryDetails.phoneNumber || ""),

          hotelPosCenterId: Number(posCenter) || 0,

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
              amount: grossLocal,
              currency: outletCurrency || "LKR",
              cardType: payments[0]?.details?.cardType || "",
              lastDigits: payments[0]?.details?.cardNo || "",
              roomNo: orderRoomNumber,
            },
          ],
        };

        try {
          await (dispatch as any)(createPosOrder(orderPayload)).unwrap();
          console.log(
            "✅ POS Order created for delivery method:",
            deliveryMethod
          );
          console.log("orderPayload : ", JSON.stringify(orderPayload));
        } catch (err) {
          console.error("❌ Failed to create POS Order:", err);
          // If order fails, stop here to avoid invoice without KOT/BOT
          setSubmitting(false);
          return;
        }
      }

      await (dispatch as any)(createPosInvoice(payload)).unwrap();
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
            (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)
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
            selectedProperty?.hotelName ||
            selectedProperty?.hotelCode ||
            "HotelMate POS",
          docNo,
          dateISO: new Date().toISOString(),
          tableNo: deliveryDetails?.tableNo,
          roomNo: deliveryDetails?.roomNo,
          cashier: "POS",
          items: cart.map((it) => ({
            itemDescription: it.name || "Item",
            quantity: Number(it.quantity || 0),
            price: Number(it.price || 0),
            lineTotal: Number(
              (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)
            ),
          })),
          // ✅ use computed subtotal and taxes from POS Center Tax Config
          subtotal: Number(subTotalLocal.toFixed(2)),
          taxes: toReceiptTaxList(taxLines), // ← array of {label, amount}
          grand: Number(taxTotals.grand.toFixed(2)),
          payments: payments.map((p) => ({
            label: `${p.method.toUpperCase()} (${p.currencyCode})`,
            foreignAmount: Number(p.amount || 0),
            localAmount: Number(p.amountLocal || 0),
          })),
          footerNote: "Thank you for your business.",
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
          <SelectItem key={c.currencyId} value={c.currencyCode}>
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

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">CASH</div>

        <div className="text-sm mb-2">Account</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        <div className="grid grid-cols-2 gap-3 ">
          <div>
            <div className="text-sm mt-4 mb-2">Currency</div>
            <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
          </div>

          <div>
            <div className="text-sm mt-4 mb-2">Amount</div>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="mt-5 w-full bg-[#8daaee] hover:bg-[#1a3f92]"
          onClick={async () => {
            const num = parseFloat(amount || "0");
            if (!num || !accountId) return;
            const rate = await getPairRate(currencyCode, outletCurrency); // pay → outlet
            recordPayment({
              method: "cash",
              amount: num, // entered in pay currency
              currencyCode, // pay currency
              accountId,
              exchangeRate: rate, // convert to outlet currency
            });
            setAmount("");
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

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">GIFT VOUCHER</div>

        <div className="text-sm mb-2">Account</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        <div className="text-sm mt-4 mb-2">Currency</div>
        <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />

        <div className="text-sm mt-4 mb-2">Voucher Code</div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Voucher Code"
        />

        <div className="text-sm mt-4 mb-2">Amount</div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          onClick={() => {
            const num = parseFloat(amount || "0");
            if (!num || !code || !accountId) return;
            recordPayment({
              method: "giftVoucher",
              amount: num,
              currencyCode,
              accountId,
              details: { voucherCode: code },
            });
            setAmount("");
            setCode("");
          }}
        >
          Record Payment
        </Button>
      </div>
    );
  }

  function CityLedgerForm() {
    const [amount, setAmount] = useState("");
    const [currencyCode, setCurrencyCode] = useState<string>(
      currencies?.[0]?.currencyCode ?? "LKR"
    );
    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    return (
      <div className={formCardBase}>
        <div className="font-semibold mb-4">CITY LEDGER</div>

        <div className="text-sm mb-2">Account</div>
        <GLAccountSelect value={accountId} onChange={setAccountId} />

        <div className="text-sm mt-4 mb-2">Currency</div>
        <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />

        <div className="text-sm mt-4 mb-2">Amount</div>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
        />

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          onClick={() => {
            const num = parseFloat(amount || "0");
            if (!num || !accountId) return;
            recordPayment({
              method: "cityLedger",
              amount: num,
              currencyCode,
              accountId,
            });
            setAmount("");
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
            <Input value={remaining.toFixed(2)} disabled />
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
    const [amount, setAmount] = useState(remaining.toFixed(2)); // default to remaining
    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    useEffect(() => {
      // keep default aligned with “remaining” until user edits
      setAmount(remaining.toFixed(2));
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

    // NEW: don't overwrite user's edits
    const [touchedAmount, setTouchedAmount] = useState(false);

    const [accountId, setAccountId] = useState<number>(
      filteredAccounts[0]?.accountID ?? 0
    );

    const meta = brandMeta(brand);
    const canSubmit = !!accountId && Number(amount) > 0 && last4.length === 4;

    // NEW: prefill amount with "remaining" once (or whenever remaining changes) until user edits
    useEffect(() => {
      if (!touchedAmount) {
        setAmount(remaining.toFixed(2));
      }
    }, [remaining, touchedAmount]);

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
            {/* Ensure CurrencySelect renders a 40px trigger to match inputs */}
            <CurrencySelect
              value={currencyCode}
              onChange={setCurrencyCode}
              className="h-10"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="text-sm">Amount</div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                setTouchedAmount(true);
                setAmount(e.target.value);
              }}
              placeholder="Amount"
              className="h-10"
            />
          </div>
        </div>

        <Button
          className="mt-5 w-full bg-[#224FB6] hover:bg-[#1a3f92]"
          disabled={!canSubmit}
          onClick={async () => {
            const num = parseFloat(amount || "0");
            if (!canSubmit) return;
            const rate = await getPairRate(currencyCode, outletCurrency);
            recordPayment({
              method: "card",
              amount: num,
              currencyCode,
              accountId,
              exchangeRate: rate,
              details: { cardType: brand.toUpperCase(), cardNo: last4 },
            });
            setAmount("");
            setLast4("");
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

    const receiptLines = snapCart.map((it) => ({
      itemDescription: it.name || "Item",
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
      lineTotal: Number(
        (Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)
      ),
    }));

    const paymentsForHtml = snapPays.map((p) => ({
      label: `${p.method.toUpperCase()} (${p.currencyCode})`,
      foreignAmount: Number(p.amount || 0),
      localAmount: Number(p.amountLocal || 0),
    }));

    return buildReceiptEmailHtml({
      hotelName: snapProp?.hotelName || snapProp?.hotelCode || "HotelMate POS",
      docNo,
      dateISO: new Date().toISOString(),
      tableNo: snapDelivery?.tableNo,
      roomNo: snapDelivery?.roomNo,
      cashier: "POS",
      items: receiptLines,
      subtotal: Number(subTotalLocal.toFixed(2)),
      taxes: toReceiptTaxList(taxLines), // dynamic
      grand: Number(taxTotals.grand.toFixed(2)), // dynamic
      payments: paymentsForHtml,
      footerNote: "Powered by HotelMate",
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
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        remaining === 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {remaining === 0
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
      {remaining === 0 && (
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

  // reset readiness whenever the html changes or the sheet reopens
  useEffect(() => {
    if (open) setReadyToPrint(false);
  }, [open, html]);

  const emailLooksValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((emailTo || "").trim()),
    [emailTo]
  );

  function safeHtml(s: string) {
    // strip any script tags just in case
    return s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }

  const doPrint = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const win = iframe.contentWindow;
    const doc = win?.document;
    const loaded =
      doc?.readyState === "complete" || doc?.readyState === "interactive";

    const run = () => {
      try {
        win?.focus();
        win?.print(); // ← ONLY here; never on load
      } catch {
        const popup = window.open("", "_blank");
        if (popup) {
          popup.document.open();
          popup.document.write(safeHtml(html));
          popup.document.close();
          popup.focus();
          popup.onload = () => {
            popup.print();
            popup.close();
          };
        }
      }
    };

    setTimeout(run, loaded ? 0 : 50);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[720px] max-h-[100dvh] p-0 flex flex-col"
      >
        <div className="px-4 py-3 border-b">
          <SheetHeader>
            <SheetTitle>Receipt</SheetTitle>
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
                  // keep sandbox restrictive; DO NOT print on load
                  sandbox="allow-same-origin"
                  srcDoc={safeHtml(html)}
                  className="w-full h-full bg-white"
                  onLoad={() => setReadyToPrint(true)}
                />
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Tip: set paper width to 80mm in the print dialog.
              </div>

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
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
