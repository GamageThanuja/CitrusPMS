// @ts-nocheck
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { fetchFolioByReservationDetailId } from "@/redux/slices/folioSlice";
import { fetchRateDetailsById } from "@/redux/slices/rateDetailsSlice";
import { fetchReservationById } from "@/redux/slices/reservationByIdSlice";
import { SendEmailModal } from "@/components/modals/sendEmailModal";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import {
  fetchHotelByGuid,
  selectHotelByGuid,
} from "@/redux/slices/fetchHotelByGuidSlice";
import type { HotelPayload } from "@/types/hotel";

/** Remove query string from a URL (e.g., AWS signed params) */
function stripQuery(u?: string | null): string {
  if (!u) return "";
  const i = u.indexOf("?");
  return i === -1 ? u : u.slice(0, i);
}

type InvoicePrintDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  reservationDetailId?: number | string;
  reservationId?: number | string;
  title?: string;
};

export default function InvoicePrintDrawer({
  isOpen,
  onClose,
  reservationDetailId,
  reservationId,
  title = "Invoice Print",
}: InvoicePrintDrawerProps) {
  const dispatch = useDispatch();

  const { data: folioItems = [], loading: folioLoading } = useAppSelector(
    (state) => state.folio || { data: [], loading: false }
  );
  const rateDetails = useAppSelector((state) => state.rateDetails?.data || []);
  const reservation = useAppSelector(
    (state) => state.reservationById?.data || null
  );
  const hotelByGuid: HotelPayload | null =
    (useAppSelector(selectHotelByGuid)?.data as unknown as HotelPayload) ||
    null;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [hotelImages, setHotelImages] = useState<any[]>([]);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState(reservation?.email || "");
  const [emailSending, setEmailSending] = useState(false);

  const [iframeSrc, setIframeSrc] = useState<string>("about:blank");

  async function fetchHotelImagesByHotelId(hotelId?: number | string) {
    if (!hotelId) return;
    try {
      const tokenRaw = localStorage.getItem("hotelmateTokens");
      const accessToken = tokenRaw
        ? JSON.parse(tokenRaw)?.accessToken
        : undefined;

      const res = await fetch(
        `https://api.hotelmate.app/api/HotelImage/hotel/${hotelId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHotelImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchHotelImagesByHotelId failed", err);
      setHotelImages([]);
    }
  }

  const postFolioToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;

    const currencyCode = hotelByGuid?.currencyCode || "";

    const items = (folioItems ?? []).map((it: any) => ({
      tranDate: it?.tranDate,
      tranType: it?.tranType,
      docNo: it?.docNo,
      accountName: it?.accountName,
      paymentMethod: it?.paymentMethod,
      credit: it?.credit,
      debit: it?.debit,
      amount: it?.amount,
      currencyCode,
    }));
    const total = (folioItems ?? []).reduce((s: number, it: any) => {
      const n = Number(it?.amount);
      return Number.isFinite(n) ? s + n : s;
    }, 0);
    target.postMessage(
      { type: "FOLIO_PAYLOAD", payload: { items, total, currencyCode } },
      "*"
    );
  }, [folioItems, hotelByGuid]);

  const postReservationToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target || !reservation) return;

    // Try to read selectedProperty for hotel header fields
    let selectedProperty: any = null;
    try {
      const raw = localStorage.getItem("selectedProperty");
      selectedProperty = raw ? JSON.parse(raw) : null;
    } catch {}

    const room = reservation?.rooms?.[0];
    target.postMessage(
      {
        type: "RES_HEADER",
        payload: {
          // Hotel header
          hotelName:
            reservation?.hotelName ||
            selectedProperty?.hotelName ||
            selectedProperty?.name ||
            "",
          hotelPhone: hotelByGuid?.hotelPhone || "",
          hotelEmail: hotelByGuid?.hotelEmail || "",
          hotelLogo: stripQuery(hotelByGuid?.logoURL || ""),

          // Left block
          roomType: room?.roomType,
          roomNo: room?.roomNumber,
          checkIn: reservation?.resCheckIn,
          bookingRef: reservation?.refNo,
          agent: reservation?.phone,

          // Right block
          reservationNo: reservation?.reservationNo,
          reservationDate: reservation?.resCheckIn || reservation?.createdOn,
          adults: room?.adults,
          children: room?.child,
          arrival: reservation?.resCheckIn,
          dept: reservation?.resCheckOut,
          mealPlan: room?.basis,

          // Guest info
          bookerName: reservation?.bookerFullName?.trim?.(),
          nationality: "N/A",
          phone: reservation?.phone,
          email: reservation?.email,

          // Bank details
          accountName: hotelByGuid?.accountName || "",
          bankBranch: hotelByGuid?.bankBranch || "",
          bankName: hotelByGuid?.bankName || "",
          accountNo: hotelByGuid?.accountNo || "",
          swiftCode: hotelByGuid?.swiftCode || "",
        },
      },
      "*"
    );
  }, [reservation, hotelByGuid]);

  useEffect(() => {
    if (!isOpen) return;
    // try to post in case iframe is already loaded
    postFolioToIframe();
  }, [isOpen, folioItems, postFolioToIframe]);

  useEffect(() => {
    if (!isOpen) return;
    postReservationToIframe();
  }, [isOpen, reservation, hotelByGuid, postReservationToIframe]);

  useEffect(() => {
    if (emailModalOpen) {
      setEmailTo(reservation?.email || "");
    }
  }, [emailModalOpen, reservation]);

  useEffect(() => {
    if (isOpen) {
      // set cache-busted src only once per open to avoid flicker on re-renders
      setIframeSrc(`/template/invoice-template.html?_=${Date.now()}`);
    } else {
      setIframeSrc("about:blank");
    }
  }, [isOpen]);

  const onIframeLoad = useCallback(() => {
    // Debounce one frame to let the DOM settle before postMessage
    requestAnimationFrame(() => {
      postReservationToIframe();
      postFolioToIframe();
    });
  }, [postReservationToIframe, postFolioToIframe]);

  useEffect(() => {
    if (isOpen && reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(Number(reservationDetailId)));
      dispatch(fetchRateDetailsById(Number(reservationDetailId)) as any);
      dispatch(fetchReservationById(Number(reservationId)) as any);
    }
    if (isOpen) {
      dispatch(fetchHotelByGuid() as any);
    }
  }, [dispatch, isOpen, reservationDetailId, reservationId]);

  useEffect(() => {
    if (!isOpen) return;
    const hid =
      reservation?.hotelID ?? reservation?.hotelId ?? reservation?.hotel?.id;
    fetchHotelImagesByHotelId(hid);
  }, [isOpen, reservation]);

  // Listen for EMAIL_CLICK and other messages from iframe
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e?.data || typeof e.data !== "object") return;
      const data = e.data as any;

      if (data.type === "EMAIL_CLICK") {
        setEmailModalOpen(true);
      } else if (data.type === "PAY_HERE_CLICK") {
        // Handle Pay Here functionality if needed
        console.log("Pay Here clicked:", data.payload);
      } else if (data.type === "UPDATE_BANK_DETAILS") {
        // Handle bank details update if needed
        console.log("Update bank details:", data.payload);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  const totalAmount = useMemo(() => {
    return (folioItems ?? []).reduce((sum, it) => {
      const n = Number(it?.amount);
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
  }, [folioItems]);

  const totalNetRate = useMemo(() => {
    return (rateDetails ?? []).reduce(
      (sum: number, r: any) => sum + Number(r?.netRate || 0),
      0
    );
  }, [rateDetails]);

  function safeFormatDate(d?: string | Date) {
    if (!d) return "—";
    try {
      const dt = typeof d === "string" ? new Date(d) : d;
      if (isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString();
    } catch {
      return "—";
    }
  }

  function sanitizeForEmail(html: string): string {
    // Remove floating actions div
    const withoutFab = html.replace(
      /<div id=\"floating-actions[\s\S]*?<\/div>\s*/i,
      ""
    );
    // Remove all script tags
    const withoutScripts = withoutFab.replace(
      /<script[\s\S]*?<\/script>/gi,
      ""
    );
    // Enforce white background style on body
    return withoutScripts.replace(
      /<body(.*?)>/i,
      '<body$1 style="margin:0;padding:20px;font-family:Arial, sans-serif;font-size:12px;background-color:#ffffff;">'
    );
  }

  async function getPopulatedInvoiceHtmlFromIframe(
    iframe: HTMLIFrameElement | null
  ): Promise<string> {
    if (!iframe) return "";
    // Wait briefly to ensure iframe content is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return "";
      const html = doc.documentElement.outerHTML;
      return sanitizeForEmail(html);
    } catch {
      return "";
    }
  }

  const handleSendInvoiceEmail = async () => {
    const email = (emailTo || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }
    try {
      setEmailSending(true);
      const html = await getPopulatedInvoiceHtmlFromIframe(iframeRef.current);
      const subject = `Invoice #${
        reservation?.reservationNo ?? reservationDetailId ?? ""
      }`.trim();
      await dispatch(
        // @ts-ignore (unwrap available on RTK thunks)
        sendCustomEmail({ toEmail: email, subject, body: html, isHtml: true })
      ).unwrap();
      // Defer closing the modal so the toast can mount outside this tree
      setTimeout(() => setEmailModalOpen(false), 0);
    } catch (e: any) {
      const msg =
        typeof e === "string" ? e : e?.message || "Failed to send email.";
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => (!open ? onClose() : null)}
      modal={false}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-l-2xl p-0 z-[100]"
      >
        <SheetHeader className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-4rem)] p-0">
          <div className="h-[calc(100vh-4rem)]">
            <iframe
              ref={iframeRef}
              key={String(reservationDetailId) + "-" + String(isOpen)}
              src={iframeSrc}
              title="Invoice Template"
              style={{
                width: "100%",
                height: "100%",
                border: "0",
                display: "block",
              }}
              onLoad={onIframeLoad}
            />
          </div>
        </ScrollArea>
        <SendEmailModal
          open={emailModalOpen}
          email={emailTo}
          onEmailChange={setEmailTo}
          onClose={() => setEmailModalOpen(false)}
          onSend={handleSendInvoiceEmail}
          sending={emailSending}
        />
      </SheetContent>
    </Sheet>
  );
}
