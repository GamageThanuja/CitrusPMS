"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CreditCard,
  Landmark,
  PenLine,
  FileText,
  CircleCheckBig,
  HandCoins,
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchGlAccounts } from "@/redux/slices/glAccountSlice";
// ✅ use the new slice
import {
  fetchReservationDetailsById,
  selectReservationDetailsItems,
} from "@/redux/slices/fetchreservtaionByIdSlice";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  fetchFolioByDetailId,
  selectFolioByDetailIdData,
  selectFolioByDetailIdLoading,
} from "@/redux/slices/fetchFolioByDetailIdSlice";
import { useCurrency } from "@/hooks/useCurrency";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { fetchExchangeRate } from "@/redux/slices/currencyExchangeSlice";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import {
  takeReservationPayment,
  selectTakePaymentStatus,
  selectTakePaymentError,
} from "@/redux/slices/takeReservationPaymentSlice";
import { useHotelLogo } from "@/hooks/useHotelLogo";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import { fetchGuestProfileByReservationDetailId } from "@/redux/slices/guestProfileByReservationSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    email?: string;
  };
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isBookingPageView?: boolean; // <— new
};

const paymentMethods = [
  { label: "Cash", icon: Banknote },
  { label: "Card", icon: CreditCard },
  { label: "Online Banking", icon: Landmark },
  { label: "Cheque", icon: PenLine },
  { label: "City Ledger", icon: FileText },
  { label: "Credit", icon: HandCoins },
];

export function TakePaymentsDrawer({
  bookingDetail,
  open,
  onClose,
  onComplete,
  isBookingPageView = false,
}: DrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currencies, setCurrencies] = useState<
    { currencyId: string; currencyCode: string; currencyName: string }[]
  >([]);
  console.log("currencies : ", currencies);
  console.log("booking detail take payment : ", bookingDetail);

  console.log("amount : ", amount);

  const isCityLedger = method === "City Ledger";

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  // --- Payment method normalization + helpers ---
  const paymentMethodMap: Record<string, string> = {
    Cash: "CASH",
    Card: "CARD",
    "Online Banking": "BANK_TRANSFER",
    Cheque: "CHEQUE",
    "City Ledger": "CITY_LEDGER",
    Credit: "CREDIT",
  };

  const mapPaymentMethod = (uiLabel: string) =>
    paymentMethodMap[uiLabel] ?? uiLabel ?? "CASH";

  const roundMoney = (n: number) =>
    Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const payStatus = useAppSelector(selectTakePaymentStatus); // "idle" | "loading" | "succeeded" | "failed"
  const payError = useAppSelector(selectTakePaymentError);

  async function resolveGuestEmail(
    dispatch: AppDispatch,
    rdid: number | undefined,
    fallbackEmail?: string
  ): Promise<string> {
    try {
      if (rdid) {
        const profile = await dispatch(
          fetchGuestProfileByReservationDetailId(rdid)
        ).unwrap();
        const primary = profile?.email?.trim();
        if (primary) {
          console.log("resolveGuestEmail → using profile.email:", primary);
          return primary;
        }
      }
    } catch (e) {
      console.warn("resolveGuestEmail → profile lookup failed:", e);
    }
    const fb = (fallbackEmail || "").trim();
    if (fb) {
      console.log(
        "resolveGuestEmail → using fallback bookingDetail.email:",
        fb
      );
      return fb;
    }
    console.warn("resolveGuestEmail → no email available");
    return "";
  }

  useEffect(() => {
    if (payStatus === "failed" && payError) {
      toast.error(payError);
    }
  }, [payStatus, payError]);

  console.log("System Date from Redux take payment:", systemDate);

  const methodSelected = !!method;

  const [currency, setCurrency] = useState("");
  const [accounts, setAccounts] = useState<
    { accountID: number; accountName: string; accountTypeID: number }[]
  >([]);
  const [selectedAccountID, setSelectedAccountID] = useState("");
  const [agents, setAgents] = useState<{ nameID: number; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState("");
  const hotelCurrency = useStoredCurrencyCode();
  // Per-room payer currency + rate
  const [perRoomCurrency, setPerRoomCurrency] = useState<
    Record<number, string>
  >({});
  const [perRoomRate, setPerRoomRate] = useState<Record<number, number>>({});
  const [perRoomRateLoading, setPerRoomRateLoading] = useState<
    Record<number, boolean>
  >({});
  const [perRoomRateError, setPerRoomRateError] = useState<
    Record<number, string | null>
  >({});

  async function loadRateForRoom(rdid: number, baseCurrency: string) {
    // same endpoint your thunk uses
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken as string | undefined;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    // if base == hotelCurrency, we don't need network
    if (!hotelCurrency || baseCurrency === hotelCurrency) {
      setPerRoomRate((m) => ({ ...m, [rdid]: 1 }));
      setPerRoomRateLoading((m) => ({ ...m, [rdid]: false }));
      setPerRoomRateError((m) => ({ ...m, [rdid]: null }));
      return;
    }

    try {
      setPerRoomRateLoading((m) => ({ ...m, [rdid]: true }));
      setPerRoomRateError((m) => ({ ...m, [rdid]: null }));

      const url = `${BASE_URL}/api/Currency/exchange-rate?baseCurrency=${encodeURIComponent(
        baseCurrency
      )}&targetCurrency=${encodeURIComponent(hotelCurrency)}`;

      const res = await fetch(url, {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          "X-Hotel-Id": hotelId, // keep if your API expects it
        },
      });

      if (!res.ok) throw new Error(`Rate HTTP ${res.status}`);
      const raw = await res.text();
      const rateNum = parseFloat(raw);
      if (!isFinite(rateNum) || rateNum <= 0) throw new Error("Invalid rate");

      setPerRoomRate((m) => ({ ...m, [rdid]: rateNum }));
    } catch (e: any) {
      setPerRoomRateError((m) => ({
        ...m,
        [rdid]: e?.message ?? "Rate error",
      }));
      setPerRoomRate((m) => ({ ...m, [rdid]: 0 })); // block submit for this room
    } finally {
      setPerRoomRateLoading((m) => ({ ...m, [rdid]: false }));
    }
  }

  const {
    rate,
    loading: rateLoading,
    error: rateError,
  } = useAppSelector(
    (s) => s.currencyExchange || { rate: null, loading: false, error: null }
  );

  const EPS = 0.005;

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const isCloseToZero = (n: number) => Math.abs(n) < EPS;
  // per-room folio totals (in HOTEL currency)
  const [perRoomFolioTotals, setPerRoomFolioTotals] = useState<
    Record<number, number>
  >({});

  // sum helper: add Number(it.amount) with safety
  const sumFolio = (items: any[]) =>
    (items ?? []).reduce((s, it) => {
      const n = Number(it?.amount);
      return Number.isFinite(n) ? s + n : s;
    }, 0);

  useEffect(() => {
    // Only fetch when both codes exist and differ
    if (currency && hotelCurrency && currency !== hotelCurrency) {
      dispatch(
        fetchExchangeRate({
          baseCurrency: currency,
          targetCurrency: hotelCurrency,
        })
      );
    }
  }, [currency, hotelCurrency, dispatch]);

  const PAID_STAMP_URL =
    "https://hotelmate-internal.s3.us-east-1.amazonaws.com/paid.png";

  const { logoUrl } = useHotelLogo();

  // tiny money formatter with fallback
  const fmtMoney = (code: string, n: number) =>
    `${code || "LKR"} ${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  /** Build Wave-like HTML receipt body (table-based, email-safe) */
  function buildReceiptEmailHtml(opts: {
    logo?: string;
    invoiceNo: string;
    companyName: string;
    companyAddressLines?: string[];
    phone?: string;
    website?: string;
    paidAmount: number;
    paidCurrency: string; // payer-entered currency (e.g., LKR)
    paidMethod: string; // UI label (Cash, Card, etc.)
    paidDateISO: string; // ISO date string
    paidStampUrl?: string;
    forLine: string; // e.g., "for ALMA LANKA HOSPITALITY (PVT) LTD"
  }) {
    const {
      logo,
      invoiceNo,
      companyName,
      companyAddressLines = [],
      phone,
      website,
      paidAmount,
      paidCurrency,
      paidMethod,
      paidDateISO,
      paidStampUrl,
      forLine,
    } = opts;

    const paidOn = new Date(
      paidDateISO || new Date().toISOString()
    ).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    const addrHtml = companyAddressLines.map((l) => `${l}<br>`).join("");
    const paidDisplay = fmtMoney(paidCurrency, paidAmount);

    return `
<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f6f7fb;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:8px;border:1px solid #e9ecf3;">
      <tr>
        <td align="center" style="padding:28px 24px 8px 24px;">
          <img src="${
            logo || "https://via.placeholder.com/140x42?text=LOGO"
          }" width="140" alt="Logo" style="display:block;border:0;">
        </td>
      </tr>
      <tr><td align="center" style="padding:8px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:28px;line-height:34px;font-weight:700;color:#0f172a;">Payment Receipt</div>
      </td></tr>
      <tr><td align="center" style="padding:6px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:14px;line-height:22px;color:#111827;"><strong>INVOICE #${invoiceNo}</strong></div>
      </td></tr>
      <tr><td align="center" style="padding:4px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-size:14px;line-height:22px;color:#4b5563;">
          ${forLine}<br>paid on <strong>${paidOn}</strong>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:18px 24px 16px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#111827;">
            <strong>${companyName}</strong><br>
            ${addrHtml}
            ${phone ? `Mobile: ${phone}<br>` : ""}
            ${
              website
                ? `<a href="${website}" style="color:#2563eb;text-decoration:none;">${website.replace(
                    /^https?:\/\//,
                    ""
                  )}</a>`
                : ""
            }
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-top:1px solid #e5e7eb;height:0;line-height:0;font-size:0;">&nbsp;</td></tr>
          <tr><td align="center" style="padding:10px 0 0 0;">
            <span style="display:inline-block;width:18px;height:18px;border:1px solid #e5e7eb;border-radius:999px;line-height:18px;text-align:center;color:#9ca3af;font-family:Arial,Helvetica,sans-serif;font-size:12px;">♡</span>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#111827;">
              <strong>Payment Amount:</strong>
              <span style="font-weight:700;"> ${paidDisplay}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;">
              <strong style="color:#374151;">Payment Method:</strong> ${paidMethod.toUpperCase()}
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:18px 24px 6px 24px;">
        <img src="${
          paidStampUrl || PAID_STAMP_URL
        }" width="160" alt="PAID" style="display:block;border:0;">
      </td></tr>
      <tr><td align="center" style="padding:0 24px 20px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
        Powered by <strong style="color:#111827;">wave</strong>
      </td></tr>
      <tr><td style="background:#f9fafb;border-top:1px solid #e9ecf3;border-bottom-left-radius:8px;border-bottom-right-radius:8px;padding:16px 24px 22px 24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="text-align:center;font-size:12px;line-height:20px;color:#6b7280;">
          Thanks for your business. If this invoice was sent in error,
          please contact <a href="mailto:info@citruspms.com" style="color:#2563eb;text-decoration:none;">info@citruspms.com</a>.
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  }

  // ⬇️ REPLACE your current emailReceipt with this
  async function emailReceipt({
    dispatch,
    toEmail,
    html,
    subject,
  }: {
    dispatch: AppDispatch;
    toEmail: string;
    html: string;
    subject: string;
  }) {
    if (!toEmail) {
      console.warn(
        "emailReceipt: missing toEmail, skipping send. Subject:",
        subject
      );
      return;
    }
    try {
      console.log("emailReceipt → sending to:", toEmail);
      await dispatch(
        sendCustomEmail({
          // ⚠️ match your slice payload keys
          toEmail, // if your slice expects "to", rename to: to: toEmail
          subject,
          body: html, // if your API expects "htmlBody", rename to: htmlBody: html
          isHtml: true,
        })
      ).unwrap();
      console.log("emailReceipt → sent OK:", toEmail);
    } catch (e) {
      console.error("emailReceipt → send failed:", e);
      throw e;
    }
  }

  /** resolve hotel/company info from localStorage (fallbacks safe) */
  function getCompanyInfo() {
    try {
      const propRaw = localStorage.getItem("selectedProperty");
      const p = propRaw ? JSON.parse(propRaw) : {};
      return {
        companyName: p?.hotelName || "Citrus Property Management (Pvt) Ltd",
        addressLines: [
          p?.addressLine1 || "241/1, Pipe Road,",
          p?.addressLine2 || "Koswatta",
          p?.city || "Battaramulla",
          p?.country || "Sri Lanka",
        ].filter(Boolean),
        phone: p?.contactNumber || "077 205 6666",
        website: p?.website || "https://www.citruspms.com",
      };
    } catch {
      return {
        companyName: "Citrus Property Management (Pvt) Ltd",
        addressLines: [
          "241/1, Pipe Road,",
          "Koswatta",
          "Battaramulla",
          "Sri Lanka",
        ],
        phone: "077 205 6666",
        website: "https://www.citruspms.com",
      };
    }
  }

  // We'll need dispatch from hooks (replace useDispatch with this if you prefer)

  // NEW: per-room amounts for booking view
  const [perRoomAmounts, setPerRoomAmounts] = useState<Record<number, string>>(
    {}
  );

  console.log("hello take payment drawer");

  const [booking, setBooking] = useState<any>(bookingDetail ?? {});

  const needsRate = currency && hotelCurrency && currency !== hotelCurrency;
  const rateReady =
    !needsRate || (typeof rate === "number" && isFinite(rate) && rate > 0);

  const glAccounts =
    useSelector((state: RootState) => state.glAccount.list) ?? [];
  const accountListLoading = useSelector(
    (state: RootState) => state.glAccount.listLoading
  );

  // NEW: reservation (rooms) when in booking view
// Raw items from new slice
const reservationDetailsItems = useAppSelector(selectReservationDetailsItems);

// Derive a "reservationById-like" object so the rest of the code can stay the same
const reservationById = useMemo(() => {
  if (!reservationDetailsItems || reservationDetailsItems.length === 0) {
    return null;
  }

  const first = reservationDetailsItems[0];

  return {
    reservationID: first.reservationID,
    bookerFullName: first.bookerFullName,
    rooms: reservationDetailsItems.map((item) => ({
      reservationDetailID: item.reservationDetailID,
      roomNumber: item.roomNumber,
      roomType: item.roomType,
      guest1: item.guest1,
      guest2: (item as any).guest2, // allowed by [k: string]: any
      basis: item.basis,
    })),
  };
}, [reservationDetailsItems]);

  console.log("booking page view : ", isBookingPageView);

  // Filter by hotelID
  const selectedProperty = JSON.parse(
    localStorage.getItem("selectedProperty") || "{}"
  );
  const hotelId = selectedProperty.id;

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

  // Fetch GL accounts
  useEffect(() => {
    dispatch(fetchGlAccounts());
  }, [dispatch]);

  useEffect(() => {
    if (isCityLedger) {
      setSelectedAccountID("1");
    } else {
      // optional: clear when leaving CL
      // setSelectedAccountID("");
    }
  }, [isCityLedger]);

  // Fetch reservation (room cards) if booking view
// Fetch reservation details (room cards) if booking view
useEffect(() => {
  if (isBookingPageView && bookingDetail?.reservationID) {
    dispatch(
      fetchReservationDetailsById({
        reservationId: bookingDetail.reservationID,
      })
    );
  }
}, [dispatch, isBookingPageView, bookingDetail?.reservationID]);

  // Common: fetch currencies, GL accounts (raw), agents
  useEffect(() => {
    const tokenData = localStorage.getItem("hotelmateTokens");
    const parsed = tokenData ? JSON.parse(tokenData) : null;
    const accessToken = parsed?.accessToken;
    if (!accessToken) return;

    fetch(`${BASE_URL}/api/Currency`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setCurrencies(data))
      .catch((err) => console.error("Currency fetch error:", err));

    fetch(`${BASE_URL}/api/GlAccount`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch((err) => console.error("GL Account fetch error:", err));

    fetch(`${BASE_URL}/api/NameMaster`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const hotelCode = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        ).hotelCode;
        const filteredAgents = data.filter(
          (item: any) =>
            item.hotelCode === hotelCode &&
            item.nameType === "Customer" &&
            item.taType === "Online Travel Agent"
        );
        setAgents(filteredAgents);
      })
      .catch((err) => console.error("Agent fetch error:", err));
  }, []);

  const currencyCodeResolved =
    currencies.find((c) => c.currencyCode === currency)?.currencyCode || "";

  const buildPaymentBody = ({
    amountNumber, // user-entered amount
    reservationDetailId,
    reservationId,
    baseCurrency, // selected currency from UI
  }: {
    amountNumber: number;
    reservationDetailId: number;
    reservationId: number;
    baseCurrency: string;
  }) => {
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelCode = selectedProperty?.hotelCode ?? "string";

    // IMPORTANT: no conversion
    const nowIso = new Date().toISOString();
    const today = ((state) => {
      // if you have systemDate in state, use that; otherwise yyyy-mm-dd
      try {
        const s = state?.systemDate?.value;
        if (s) return s;
      } catch {}
      return nowIso.slice(0, 10);
    })(window?.__REDUX_STATE__ || {});

    const entered =
      Math.round((Number(amountNumber || 0) + Number.EPSILON) * 100) / 100;

    const accountIdForPost = isCityLedger
      ? 1
      : parseInt(String(selectedAccountID || 0), 10) || 0;

    return {
      // --- identity/meta
      accountID: accountIdForPost,
      hotelCode: String(hotelCode),
      finAct: false,
      tranTypeId: 17,
      tranDate: systemDate, // keep date-only like your sample: "2025-09-28"
      effectiveDate: systemDate,
      docNo: "string",
      createdOn: nowIso,

      // --- AMOUNTS: use entered amount directly (NO conversion)
      tranValue: entered,
      debit: 0,
      amount: entered,
      credit: entered,

      // --- “payer currency” fields still reflect the selected currency
      currAmount: entered,
      currencyCode: String(baseCurrency || "LKR"),

      // --- force rate=1 (no conversion performed)
      exchangeRate: 1,
      convRate: "1",

      // --- misc
      nameID: 0,
      chequeNo: method === "Cheque" ? "string" : "string",
      paymentMethod: mapPaymentMethod(method),
      chequeDate: nowIso,
      reservationDetailId: Number(reservationDetailId || 0),
      isGuestLedger: true,
      reservationId: Number(reservationId || 0),
      comment: "",
      createdBy: localStorage.getItem("fullName") || "string",
      paymentReceiptRef: "string",
    };
  };

  const rdId = bookingDetail?.reservationDetailId;

  console.log("rdId : ", rdId);

  // Folio
// Folio (from fetchFolioByDetailId slice)
const folioItems = useAppSelector(selectFolioByDetailIdData);
const folioLoading = useAppSelector(selectFolioByDetailIdLoading);

  console.log("Folio Items : ", folioItems);

useEffect(() => {
  if (rdId) {
    dispatch(fetchFolioByDetailId(rdId));
  }
}, [dispatch, rdId]);

  // Single-room (drawer opened from a room card)
  const totalAmountSingle = useMemo(() => {
    return (folioItems ?? []).reduce((sum: number, it: any) => {
      const n = Number(it?.amount);
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
  }, [folioItems]);

  // Group booking: sum folio totals of all rooms (already in HOTEL currency)
  const totalAmountGroup = useMemo(() => {
    return Object.values(perRoomFolioTotals).reduce((s, n) => {
      const v = Number(n);
      return Number.isFinite(v) ? s + v : s;
    }, 0);
  }, [perRoomFolioTotals]);

  // Use group sum when booking view; otherwise single room total
  const totalDue = useMemo(() => {
    const raw = isBookingPageView ? totalAmountGroup : totalAmountSingle;
    const n = Number(raw || 0);
    return Number.isFinite(n) ? n : 0;
  }, [isBookingPageView, totalAmountGroup, totalAmountSingle]);

  console.log("totalDue : ", totalDue);

  // Load folio totals for each room (group reservations)
  useEffect(() => {
    if (!isBookingPageView || !reservationById?.rooms?.length) return;

    const tokenData = localStorage.getItem("hotelmateTokens");
    const parsed = tokenData ? JSON.parse(tokenData) : null;
    const accessToken = parsed?.accessToken;
    if (!accessToken) return;

    const controller = new AbortController();

    (async () => {
      try {
        const out: Record<number, number> = {};

        await Promise.all(
          reservationById.rooms.map(async (room: any) => {
            const rdid = room?.reservationDetailID;
            if (!rdid) return;
            const total = await fetchFolioTotalForRdid(
              rdid,
              accessToken,
              controller.signal
            );
            out[rdid] = total;
          })
        );

        setPerRoomFolioTotals(out);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("Per-room folio totals fetch error:", e);
        }
      }
    })();

    return () => controller.abort();
    // re-run if the RDID set changes
  }, [
    isBookingPageView,
    reservationById?.rooms?.map((r: any) => r?.reservationDetailID).join(","),
  ]);

  useEffect(() => {
    if (!method) return;

    if (isCityLedger) {
      // single-room view
      if (!isBookingPageView) {
        // totalDue is already in HOTEL currency
        const auto = Number(totalDue || 0);
        setAmount(auto > 0 ? auto.toFixed(2) : "0.00");
        setCurrency(hotelCurrency || "LKR");
      } else {
        // booking (multi-room): fill each room with its folio total
        const nextAmounts: Record<number, string> = {};
        const nextCur: Record<number, string> = {};
        (reservationById?.rooms ?? []).forEach((r: any) => {
          const rdid = r?.reservationDetailID;
          const folioTotal = Number(perRoomFolioTotals[rdid] ?? 0);
          nextAmounts[rdid] = folioTotal > 0 ? folioTotal.toFixed(2) : "0.00";
          nextCur[rdid] = hotelCurrency || "LKR";
        });
        setPerRoomAmounts(nextAmounts);
        setPerRoomCurrency((m) => ({ ...m, ...nextCur }));
        // ensure all room rates are 1 (no conversion, hotel currency)
        const nextRate: Record<number, number> = {};
        (reservationById?.rooms ?? []).forEach((r: any) => {
          const rdid = r?.reservationDetailID;
          nextRate[rdid] = 1;
        });
        setPerRoomRate((m) => ({ ...m, ...nextRate }));
        setPerRoomRateError({});
      }
    }
  }, [
    isCityLedger,
    isBookingPageView,
    hotelCurrency,
    totalDue,
    reservationById?.rooms,
    perRoomFolioTotals,
  ]);

  const groupNeedsRateButMissing = useMemo(() => {
    if (!isBookingPageView || !reservationById?.rooms?.length) return false;
    return reservationById.rooms.some((r: any) => {
      const rdid = r?.reservationDetailID;
      const amt = Number(perRoomAmounts[rdid] || 0);
      if (!(amt > 0)) return false; // only care about rooms we’re charging
      const base = perRoomCurrency[rdid] || hotelCurrency;
      if (!base || base === hotelCurrency) return false; // no rate needed
      const exch = perRoomRate[rdid];
      return !(typeof exch === "number" && isFinite(exch) && exch > 0);
    });
  }, [
    isBookingPageView,
    reservationById?.rooms,
    perRoomAmounts,
    perRoomCurrency,
    perRoomRate,
    hotelCurrency,
  ]);

  const handleConfirm = () => {
    setIsSubmitting(true);

    const tokenData = localStorage.getItem("hotelmateTokens");
    const parsedToken = tokenData ? JSON.parse(tokenData) : null;
    const accessToken = parsedToken?.accessToken;

    if (!accessToken) {
      setIsSubmitting(false);
      return;
    }

    // ---- MODE A: Booking Page View (per-room) ----
    if (isBookingPageView && reservationById?.rooms?.length) {
      const bodies = reservationById.rooms
        .map((room) => {
          const rdid = room.reservationDetailID;
          const raw = perRoomAmounts[rdid];
          const num = isCityLedger
            ? Number(perRoomFolioTotals[rdid] ?? 0)
            : Number(raw);
          const base = isCityLedger
            ? (hotelCurrency as string)
            : perRoomCurrency[rdid] || hotelCurrency;
          if (!raw || isNaN(num) || num <= 0) return null;

          const exch = base === hotelCurrency ? 1 : perRoomRate[rdid] ?? 0;

          if (base !== hotelCurrency && !(exch > 0)) {
            toast.error(
              `Exchange rate unavailable for ${base} → ${hotelCurrency}.`
            );
            return null; // skip this room
          }

          return buildPaymentBody({
            amountNumber: num,
            reservationDetailId: rdid,
            reservationId: reservationById.reservationID,
            baseCurrency: base,
          });
        })
        .filter(Boolean);

      if (!bodies.length) {
        setIsSubmitting(false);
        toast.error("Enter at least one room amount > 0");
        return;
      }

      setPayloadPreview(JSON.stringify(bodies, null, 2));
      console.log("payload preview : ", payloadPreview);

      console.log("Taking group payment:", bodies);

      dispatch(takeReservationPayment(bodies as any))
        .unwrap()
        .then(async (resp) => {
          // resp is ReservationPaymentResponse[]
          console.log("✅ takeReservationPayment (group) response:");
          console.log(JSON.stringify(resp, null, 2)); // <-- pretty JSON

          try {
            const { companyName, addressLines, phone, website } =
              getCompanyInfo();

            // Send one email per body/room (if guest email exists)
            await Promise.all(
              (bodies as any[]).map(async (b, idx) => {
                try {
                  const rdid = Number(b?.reservationDetailId || 0);
                  if (!rdid) return;

                  // ✅ fetch a profile for this room
                  const profile = await dispatch(
                    fetchGuestProfileByReservationDetailId(rdid)
                  ).unwrap();

                  const toEmail = profile?.email?.trim() || bookingDetail.email;
                  console.log("toEmail (group):", toEmail);

                  if (!toEmail) {
                    console.warn(
                      `No guest email for RDID ${rdid}; skipping receipt`
                    );
                    return;
                  }

                  const invNo = String(
                    resp?.[idx]?.paymentReceiptRef ||
                      resp?.[idx]?.docNo ||
                      `G-${Date.now()}-${idx + 1}`
                  );

                  const room = reservationById?.rooms?.find(
                    (r: any) => r.reservationDetailID === rdid
                  );

                  const html = buildReceiptEmailHtml({
                    logo: logoUrl,
                    invoiceNo: invNo,
                    companyName,
                    companyAddressLines: addressLines,
                    phone,
                    website,
                    paidAmount: Number(b?.currAmount || 0),
                    paidCurrency: String(
                      b?.currencyCode || hotelCurrency || "LKR"
                    ),
                    paidMethod: method,
                    paidDateISO: systemDate || new Date().toISOString(),
                    paidStampUrl: PAID_STAMP_URL,
                    forLine: `for ${room?.guest1 || "Guest"} (Room ${
                      room?.roomNumber || ""
                    })`,
                  });

                  await emailReceipt({
                    dispatch,
                    toEmail,
                    subject: `Payment Receipt – ${companyName} – ${invNo}`,
                    html,
                  });
                } catch (e) {
                  console.error("Group receipt email error (room):", e);
                }
              })
            );
          } catch (e) {
            console.error("Group receipt email error:", e);
          }

          setIsSubmitting(false);
          onComplete?.();
          toast.custom(
            () => (
              <div className="bg-background border border-border rounded-lg p-4 flex items-center gap-3">
                <CircleCheckBig className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-medium">Payments processed!</h3>
                  <p className="text-sm text-muted-foreground">
                    Recorded {bodies.length} payment
                    {bodies.length > 1 ? "s" : ""} by {method}.
                  </p>
                </div>
              </div>
            ),
            { duration: 2500 }
          );
          setShowCompleteModal(true);
        })
        .catch((err) => {
          console.error("❌ takeReservationPayment (group) error:", err);
          setIsSubmitting(false);
        });

      return;
    }

    const amountNumber = Number(amount);
    const base = isCityLedger
      ? (hotelCurrency as string)
      : currency || hotelCurrency;

    const amountNumberForSingle = isCityLedger
      ? Number(totalDue || 0)
      : Number(amount);
    // base -> hotel rate
    const exch =
      base !== hotelCurrency
        ? typeof rate === "number" && isFinite(rate)
          ? rate
          : 0
        : 1;

    if (base !== hotelCurrency && !(exch > 0)) {
      toast.error(`Exchange rate unavailable for ${base} → ${hotelCurrency}.`);
      setIsSubmitting(false);
      return;
    }

    const body = buildPaymentBody({
      amountNumber,
      reservationDetailId: booking.reservationDetailId || 0,
      reservationId: booking.reservationID || 0,
      baseCurrency: base as string,
    });

    setPayloadPreview(JSON.stringify(body, null, 2));

    console.log("payload preview : ", payloadPreview);

    console.log("Taking single payment:", body);
    console.log("Taking single payment:", JSON.stringify(body, null, 2));

    dispatch(takeReservationPayment([body] as any))
      .unwrap()
      .then(async (resp) => {
        // resp is ReservationPaymentResponse[]
        console.log("✅ takeReservationPayment (single) response:");
        console.log(JSON.stringify(resp, null, 2)); // <-- pretty JSON

        try {
          // fetch guest email from reservationDetailId
          const profile = await dispatch(
            fetchGuestProfileByReservationDetailId(booking.reservationDetailId)
          ).unwrap();

          const toEmail = profile?.email?.trim() || bookingDetail?.email;
          console.log("toEmail (single):", toEmail);

          console.log("toEmail single : ", toEmail);

          const { companyName, addressLines, phone, website } =
            getCompanyInfo();
          const invoiceNo = String(
            resp?.[0]?.paymentReceiptRef || resp?.[0]?.docNo || "20230952"
          );

          const html = buildReceiptEmailHtml({
            logo: logoUrl,
            invoiceNo,
            companyName,
            companyAddressLines: addressLines,
            phone,
            website,
            paidAmount: Number(amount || 0),
            paidCurrency: currency || hotelCurrency || "LKR",
            paidMethod: method,
            paidDateISO: systemDate || new Date().toISOString(),
            paidStampUrl: PAID_STAMP_URL,
            forLine: `for ${booking?.guest || "Guest"} (Room ${
              booking?.roomNumber || ""
            })`,
          });

          await emailReceipt({
            dispatch,
            toEmail,
            subject: `Payment Receipt – ${companyName} – ${invoiceNo}`,
            html,
          });
          console.log("toEmail 6 : ", toEmail);
        } catch (e) {
          console.error("Single receipt email error:", e);
        }

        setIsSubmitting(false);
        onComplete?.();
        toast.custom(
          () => (
            <div className="bg-background border border-border rounded-lg p-4 flex items-center gap-3">
              <CircleCheckBig className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-medium">Payment processed successfully!</h3>
              </div>
            </div>
          ),
          { duration: 2500 }
        );
        setShowCompleteModal(true);
      })
      .catch((err) => {
        console.error("❌ takeReservationPayment (single) error:", err);
        setIsSubmitting(false);
      });
  };

  const handleClose = () => {
    setShowCompleteModal(false);
    onClose();
  };

  // Shared validation
  const canSubmitSingle =
    !isBookingPageView &&
    !!amount &&
    !!method &&
    !!currency &&
    (!!selectedAccountID || method === "Credit" || isCityLedger) &&
    !isSubmitting;

  const canSubmitBooking =
    isBookingPageView &&
    !!method &&
    (!!selectedAccountID || method === "Credit" || isCityLedger) &&
    Object.values(perRoomAmounts).some((v) => Number(v) > 0) &&
    !isSubmitting;

  // 4a) Sum of what user entered in ENTERED currency
  const sumEntered = useMemo(() => {
    if (isBookingPageView) {
      return Object.values(perRoomAmounts).reduce((s, v) => {
        const n = Number(v);
        return Number.isFinite(n) ? s + n : s;
      }, 0);
    }
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [isBookingPageView, perRoomAmounts, amount]);

  // 4b) Determine effective rate (1 if same currency)
  const effectiveRate = useMemo(() => {
    if (!currency || !hotelCurrency || currency === hotelCurrency) return 1;
    // If rate still loading or missing, treat as 0 (prevents false "paid in full" bar)
    return typeof rate === "number" && isFinite(rate) ? rate : 0;
  }, [currency, hotelCurrency, rate]);

  // 4c) Convert the sum entered to the HOTEL currency side for Remaining/progress
  // sumInStore = sumEntered (entered currency) * rate(base=entered -> target=hotel)
  const sumEnteredInHotelCurrency = useMemo(() => {
    if (isBookingPageView) {
      // Sum each room: entered * that room's rate (or 1 if same currency)
      return (reservationById?.rooms ?? []).reduce((sum, r: any) => {
        const rdid = r?.reservationDetailID;
        const amt = Number(perRoomAmounts[rdid] || 0);
        const base = perRoomCurrency[rdid] || hotelCurrency; // default to hotel currency
        const roomRate = base === hotelCurrency ? 1 : perRoomRate[rdid] ?? 0; // 0 until loaded
        return sum + (isFinite(amt) ? amt * roomRate : 0);
      }, 0);
    }
    // single-room path (your previous logic)
    return sumEntered * effectiveRate;
  }, [
    isBookingPageView,
    reservationById?.rooms,
    perRoomAmounts,
    perRoomCurrency,
    perRoomRate,
    hotelCurrency,
    sumEntered,
    effectiveRate,
  ]);

  const remainingRaw = useMemo(() => {
    // keep raw for progress math
    return totalDue - sumEnteredInHotelCurrency;
  }, [totalDue, sumEnteredInHotelCurrency]);

  // Rounded value for UI decisions/text
  const remainingRounded = useMemo(() => round2(remainingRaw), [remainingRaw]);

  // Clamp tiny near-zero values to exactly 0 for display/status
  const remainingForUI = useMemo(
    () => (isCloseToZero(remainingRounded) ? 0 : remainingRounded),
    [remainingRounded]
  );

  console.log("store currency : ", hotelCurrency);

  // tiny currency formatter that falls back nicely
  const fmt = (n: number) =>
    `${hotelCurrency || "USD"} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  function parseFolioTotal(json: any) {
    // Array payload (most common)
    if (Array.isArray(json)) {
      return json.reduce((s, it) => {
        const amt = Number(it?.amount ?? it?.tranValue ?? it?.debit ?? 0);
        return Number.isFinite(amt) ? s + amt : s;
      }, 0);
    }
    // { data: [...] }
    if (json && Array.isArray(json.data)) {
      return json.data.reduce((s: number, it: any) => {
        const amt = Number(it?.amount ?? it?.tranValue ?? it?.debit ?? 0);
        return Number.isFinite(amt) ? s + amt : s;
      }, 0);
    }
    // { totalAmount: number }
    if (
      json &&
      typeof json.totalAmount === "number" &&
      isFinite(json.totalAmount)
    ) {
      return json.totalAmount;
    }
    return 0;
  }

  const isTakingPayment = payStatus === "loading";

  // try multiple candidate endpoints (first one that works)
  async function fetchFolioTotalForRdid(
    rdid: number,
    accessToken: string,
    signal?: AbortSignal
  ) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    const candidates = [
      `${base}/api/Reservation/folio/${rdid}`,
      `${base}/api/Reservation/Folio/${rdid}`,
      `${base}/api/Folio/by-reservation-detail/${rdid}`,
      `${base}/api/Folio?reservationDetailId=${rdid}`,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        });
        if (!res.ok) continue;
        const json = await res.json();
        const total = parseFolioTotal(json);
        if (Number.isFinite(total)) return total;
      } catch (e: any) {
        if (e?.name === "AbortError") throw e; // stop on abort
        // else: try next candidate
      }
    }
    return 0;
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Take Payment</SheetTitle>
          </SheetHeader>

          {/* ---- Top Summary ---- */}
          <div className="mb-3">
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      Total Due{isBookingPageView ? " (All Rooms)" : ""}
                    </span>
                    <span className="font-medium">{fmt(totalDue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Entered</span>
                    <span className="font-medium">
                      {sumEntered.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {isBookingPageView
                        ? Object.keys(perRoomCurrency || {}).length
                          ? ""
                          : hotelCurrency
                        : currency || hotelCurrency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ≈ {fmt(sumEnteredInHotelCurrency)}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-md px-3 py-2 text-right min-w-[180px]",
                    remainingForUI === 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : remainingForUI > 0
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  )}
                >
                  {remainingForUI === 0 && (
                    <div className="font-semibold">Exact</div>
                  )}
                  {remainingForUI > 0 && (
                    <div className="font-semibold">
                      Remaining: {fmt(remainingForUI)}
                    </div>
                  )}
                  {remainingForUI < 0 && (
                    <div className="font-semibold">
                      Over by {fmt(Math.abs(remainingForUI))}
                    </div>
                  )}
                </div>
              </div>

              {/* subtle progress bar */}
              <div className="mt-3 h-2 rounded bg-muted relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-2 rounded bg-primary transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (sumEnteredInHotelCurrency / (totalDue || 1)) * 100
                      )
                    ).toFixed(2)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <ScrollArea className="p-4  px-[10px] ">
            {isBookingPageView && (
              <div className="space-y-2 mt-4 px-[10px ] pb-6">
                <p className="text-sm font-medium mb-1">Rooms</p>

                {reservationById?.rooms?.map((r) => (
                  <div
                    key={r.reservationDetailID}
                    className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                  >
                    {/* Left: Room + guests */}
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {r.roomType} — #{r.roomNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.guest1}
                        {r.guest2 ? `, ${r.guest2}` : ""} • {r.basis}
                      </span>

                      {/* Folio total line */}
                      <span className="text-xs mt-1">
                        <span className="text-muted-foreground">
                          Folio Total:
                        </span>{" "}
                        <span className="font-medium">
                          {fmt(perRoomFolioTotals[r.reservationDetailID] ?? 0)}
                        </span>
                      </span>
                    </div>

                    {/* Right: Input + currency */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-row">
                        <Input
                          className="h-9 w-32 text-sm"
                          type="number"
                          placeholder="Amount"
                          value={perRoomAmounts[r.reservationDetailID] || ""}
                          onChange={(e) =>
                            setPerRoomAmounts((prev) => ({
                              ...prev,
                              [r.reservationDetailID]: e.target.value,
                            }))
                          }
                          disabled={isCityLedger}
                        />
                        {/* <span className="text-[10px] text-muted-foreground ">
                          {(() => {
                            const amt = Number(
                              perRoomAmounts[r.reservationDetailID] || 0
                            );
                            const base =
                              perRoomCurrency[r.reservationDetailID] ||
                              hotelCurrency;
                            const exch =
                              base === hotelCurrency
                                ? 1
                                : perRoomRate[r.reservationDetailID] ?? 0;
                            const loading =
                              perRoomRateLoading[r.reservationDetailID];
                            if (base === hotelCurrency) return `= ${fmt(amt)}`;
                            if (loading) return `≈ loading…`;
                            if (!exch) return `≈ rate unavailable`;
                            return `≈ ${fmt(
                              amt * exch
                            )} (${base}→${hotelCurrency} @ ${exch})`;
                          })()}
                        </span> */}
                      </div>

                      <select
                        className="border rounded-md p-2 text-xs"
                        value={
                          perRoomCurrency[r.reservationDetailID] ||
                          hotelCurrency
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const rdid = r.reservationDetailID;
                          setPerRoomCurrency((m) => ({ ...m, [rdid]: val }));
                          if (val && hotelCurrency && val !== hotelCurrency) {
                            loadRateForRoom(rdid, val);
                          } else {
                            setPerRoomRate((m) => ({ ...m, [rdid]: 1 }));
                            setPerRoomRateError((m) => ({
                              ...m,
                              [rdid]: null,
                            }));
                          }
                        }}
                        disabled={isCityLedger}
                      >
                        <option value={hotelCurrency}>
                          {hotelCurrency} (Hotel)
                        </option>
                        {!isCityLedger &&
                          currencies.map((cur) => (
                            <option
                              key={cur.currencyId}
                              value={cur.currencyCode}
                            >
                              {cur.currencyCode} - {cur.currencyName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}

                {!reservationById?.rooms?.length && (
                  <div className="text-sm text-muted-foreground">
                    Loading rooms…
                  </div>
                )}
              </div>
            )}

            {/* ---- MODE B UI: Single amount (your current content) ---- */}

            <p>
              {isBookingPageView ? (
                <>
                  Process payments for{" "}
                  <strong>
                    {reservationById?.bookerFullName || bookingDetail?.guest}
                  </strong>
                  ’s booking (per room).
                </>
              ) : (
                <>
                  Process payment for <strong>{booking.guest}</strong>’s
                  booking.
                </>
              )}
            </p>

            {/* Payment method */}
            <div className="space-y-2 mt-2 mb-2 px-[10px]">
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
            {/* <div className="dark:bg-sky-950 bg-sky-300 rounded-md py-2"> */}
            {methodSelected && (
              <div className="space-y-2  mb-2 mt-4 px-[10px]">
                <p className="text-sm font-medium mb-2">Payment Details</p>

                {/* --- Single-mode: Entered row --- */}
                {!isBookingPageView && (
                  <div className="space-y-1 px-[10px]">
                    <label className="block text-sm font-medium">Entered</label>
                    <div className="flex  flex-row items-center justify-between">
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="h-9 w-48 text-sm"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isCityLedger}
                      />
                      <div className="flex items-center gap-3">
                        <select
                          className={cn(
                            "h-9 min-w-[180px] rounded-lg border px-3 text-sm outline-none transition",
                            "bg-white dark:bg-zinc-900",
                            amount && !currency
                              ? "border-red-500 focus:ring-red-500/40"
                              : "border-zinc-300 dark:border-zinc-700"
                          )}
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          aria-invalid={!!(amount && !currency)}
                          disabled={isCityLedger}
                        >
                          {!isCityLedger && (
                            <option value="" disabled>
                              Select currency
                            </option>
                          )}
                          {/* Always include hotel currency first */}
                          {(!isCityLedger ||
                            (isCityLedger && currency === hotelCurrency)) && (
                            <option value={hotelCurrency}>
                              {hotelCurrency} — Hotel Currency
                            </option>
                          )}
                          {!isCityLedger &&
                            currencies.map((cur) => (
                              <option
                                key={cur.currencyId}
                                value={cur.currencyCode}
                              >
                                {cur.currencyCode} — {cur.currencyName}
                              </option>
                            ))}
                        </select>

                        <span
                          className={cn(
                            "text-xs rounded-full px-2 py-1",
                            "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          )}
                          title="Approximate value at current rate"
                        >
                          ≈ {fmt((Number(amount) || 0) * effectiveRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Account (hide for Credit) --- */}
                {method !== "Credit" && method !== "City Ledger" && (
                  <div className="space-y-2 mt-3 px-[10px]">
                    <label className="block text-sm font-medium">Account</label>
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={selectedAccountID}
                      onChange={(e) => setSelectedAccountID(e.target.value)}
                    >
                      <option value="">Select account</option>
                      {filteredAccounts.map((acc) => (
                        <option key={acc.accountID} value={acc.accountID}>
                          {acc.accountName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* --- Method-specific extras --- */}
                {method === "Card" && (
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-2 mt-2 mb-2 px-[10px]">
                      <label className="block mb-1 text-sm font-medium">
                        Card Type
                      </label>
                      <select className="w-full border rounded-md p-2">
                        <option value="">Select card type</option>
                        <option value="Visa">Visa</option>
                        <option value="MasterCard">MasterCard</option>
                        <option value="Amex">Amex</option>
                        <option value="Discover">Discover</option>
                      </select>
                    </div>
                    <div className="space-y-2 mt-2 mb-2 px-[10px]">
                      <label className="block mb-1 text-sm font-medium">
                        Last 4 Digits
                      </label>
                      <Input type="text" maxLength={4} placeholder="XXXX" />
                    </div>
                  </div>
                )}

                {method === "Cheque" && (
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-2 mt-2 mb-2 px-[10px]">
                      <label className="block mb-1 text-sm font-medium">
                        Cheque Number
                      </label>
                      <Input type="text" placeholder="Enter Cheque number" />
                    </div>
                    <div className="space-y-2 mt-2 mb-2 px-[10px]">
                      <label className="block mb-1 text-sm font-medium">
                        Cheque Date
                      </label>
                      <Input type="date" />
                    </div>
                  </div>
                )}

                {method === "Online Banking" && (
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-2 mt-2 mb-2 px-[10px]">
                      <label className="block mb-1 text-sm font-medium">
                        Reference Number
                      </label>
                      <Input type="text" placeholder="Enter reference number" />
                    </div>
                    <div className="space-y-2 mt-2 mb-2 px-[10px]">
                      <label className="block mb-1 text-sm font-medium">
                        Bank Name
                      </label>
                      <Input type="text" placeholder="Enter bank name" />
                    </div>
                  </div>
                )}

                {method === "Credit" && (
                  <div className="space-y-2 mt-2 mb-2 px-[10px]">
                    <label className="block mb-1 text-sm font-medium">
                      Receivable (Travel Agent)
                    </label>
                    <select className="w-full border rounded-md p-2 text-sm">
                      <option value="">Select travel agent</option>
                      {agents.map((agent) => (
                        <option key={agent.nameID} value={agent.nameID}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            {/* ---- MODE A UI: Booking Page View (per-room cards) ---- */}

            <div className="space-y-2 mt-2 mb-2 pt-4 ">
              <Button
                className="w-full"
                disabled={
                  isTakingPayment ||
                  (isBookingPageView ? !canSubmitBooking : !canSubmitSingle)
                }
                onClick={handleConfirm}
              >
                {isTakingPayment
                  ? "PROCESSING..."
                  : isBookingPageView
                  ? "CONFIRM PAYMENTS"
                  : "CONFIRM PAYMENT"}
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>Payment Complete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            {isBookingPageView ? (
              <>Your per-room payments have been recorded.</>
            ) : (
              <>
                Payment of{" "}
                <strong>
                  {currency} {amount}
                </strong>{" "}
                by <strong>{method}</strong> has been successfully recorded.
              </>
            )}
          </p>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
