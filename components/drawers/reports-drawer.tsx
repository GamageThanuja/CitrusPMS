"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { Sheet, SheetContent, SheetHeader } from "../ui/sheet";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { X, Maximize2, Minimize2, EyeIcon, ExternalLink } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchReportMasterByCategory,
  selectReportsByCategory,
  type ReportMasterItem,
} from "@/redux/slices/reportMasterSlice";
import { fetchReservationById } from "@/redux/slices/reservationByIdSlice";
import { SendEmailModal } from "@/components/modals/sendEmailModal";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
// add this with your other imports
import { patchHotelGRCPara1 } from "@/redux/slices/updateHotelSlice";
import { updateHotel } from "@/redux/slices/updateHotelSlice";
import { useDrawerToast } from "@/components/toasts/update-bill-toast";
import { fetchFolioByReservationDetailId } from "@/redux/slices/folioSlice";
import { fetchRateDetailsById } from "@/redux/slices/rateDetailsSlice";
import {
  fetchReservationRateDetails,
  selectReservationRateDetails,
} from "@/redux/slices/reservationRateDetailSlice";
import {
  fetchHotelMasByHotelCode,
  selectHotelMas,
  type HotelMasDTO,
} from "@/redux/slices/fetchHotelMasByHotelCode";
import type { HotelPayload } from "@/types/hotel";

type BookingType = {
  id?: string | number;
  guest?: string;
  roomType?: string | null;
  roomNumber?: string | null;
  nights?: number | null;
  status?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  reservationNo?: string | null;
  reservationID: number | string; // master id
  reservationDetailID: number; // detail id
  reservationStatusId?: number | string;
  createdBy?: string | null;

  // Additional optional fields used by report templates
  bookerFullName?: string | null;
  phone?: string | null;
  email?: string | null;
  nationality?: string | null;
  refNo?: string | null;

  // Extended fields from the booking detail data structure
  adults?: number;
  child?: number;
  basis?: string; // meal plan
  checkIN?: string; // Note: different case from checkIn
  checkOUT?: string; // Note: different case from checkOut
  reservationDate?: string;
  createdOn?: string;
  tourNo?: string;
  sourceOfBooking?: string;
};

type DrawerProps = {
  bookingDetail: BookingType | null;
  isOpen: boolean;
  onClose: () => void;
  reservationDetailID: number;
};

interface Report
  extends Omit<
    ReportMasterItem,
    "reportID" | "reportCategory" | "reportName" | "engine" | "reportURL"
  > {
  reportID: number | string;
  reportName?: string;
  reportURL?: string;
  engine?: string; // e.g., "CR"
  reportCategory?: string;
}

const TABS = [
  { key: "grc", label: "GRC", category: "GRC" },
  { key: "bconf", label: "B.Conf", category: "BCONF" },
  { key: "proforma", label: "Proforma", category: "PROFORMA" },
  { key: "bill", label: "Bill", category: "BILL" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const categoryFor = (key: TabKey) => TABS.find((t) => t.key === key)!.category;

/** Safely append query params to absolute or relative URLs */
function addParamsToUrl(
  url: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const u = new URL(url, base);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
    });
    if (!/^(https?:)?\/\//i.test(url)) return u.pathname + u.search + u.hash;
    return u.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
    return qs ? `${url}${joiner}${qs}` : url;
  }
}

/** Remove query string from a URL (e.g., AWS signed params) */
function stripQuery(u?: string | null): string {
  if (!u) return "";
  const i = u.indexOf("?");
  return i === -1 ? u : u.slice(0, i);
}

/** Build params (explicitly set reportcategory from the active tab) */
function buildParamsByCategory(
  reportCategoryFromTab: string,
  ctx: {
    reportID?: number | string;
    reservationID?: number | string;
    reservationDetailID?: number | string;
    reservationNo?: string | number;
  }
) {
  return {
    reportid: ctx.reportID,
    reservationid: ctx.reservationID,
    reservationdetailid: ctx.reservationDetailID,
    reservationno: ctx.reservationNo,
    reportcategory: reportCategoryFromTab,
  };
}

/** One panel per tab: it fetches ONLY when becoming active */
function ReportTab({
  category,
  isActive,
  isOpen,
  hotelCode,
  bookingDetail,
}: {
  category: string;
  isActive: boolean;
  isOpen: boolean;
  hotelCode?: number;
  bookingDetail: BookingType | null;
}) {
  const dispatch = useDispatch<any>();

  // Pull list for this category from store
  const listRaw = useSelector((s: any) =>
    selectReportsByCategory(s, category)
  ) as Report[];

  // Patch URLs (CR engine needs hotelcode) + filter invalid
  const list = useMemo<Report[]>(
    () =>
      (listRaw ?? [])
        .map((r) => {
          if (r?.engine === "CR" && r?.reportURL && hotelCode) {
            return {
              ...r,
              reportURL: addParamsToUrl(r.reportURL, { hotelcode: hotelCode }),
            };
          }
          return r;
        })
        .filter((r) => !!r.reportURL),
    [listRaw, hotelCode]
  );

  // Fetch when this tab becomes active (and only if empty)
  useEffect(() => {
    if (!isOpen || !isActive) return;
    if (!listRaw || listRaw.length === 0) {
      dispatch(fetchReportMasterByCategory({ reportCategory: category }));
    }
  }, [isOpen, isActive, category, dispatch, listRaw]);

  // Selected report (local to this tab)
  const [selected, setSelected] = useState<Report | null>(null);

  // Ensure a selection exists on load or when list changes while active
  useEffect(() => {
    if (!isActive) return;
    if (!selected && list.length > 0) setSelected(list[0]);
    // If the first report changed (e.g., after a re-fetch), align selection
    if (selected && list.length > 0) {
      const stillExists = list.find((r) => r.reportID === selected.reportID);
      if (!stillExists) setSelected(list[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, list?.[0]?.reportID]);

  const finalUrl = useMemo(() => {
    if (!selected?.reportURL) return "";
    const params = buildParamsByCategory(category, {
      reportID: selected.reportID,
      reservationID: bookingDetail?.reservationID,
      reservationDetailID: bookingDetail?.reservationDetailID,
      reservationNo: bookingDetail?.reservationNo,
    });
    return addParamsToUrl(selected.reportURL, params);
  }, [selected, category, bookingDetail]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-3">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {list.length === 0 && (
          <div className="text-sm text-muted-foreground">
            {isActive ? "Loading..." : "No reports."}
          </div>
        )}
        {list.map((r) => (
          <button
            key={r.reportID}
            type="button"
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
              selected?.reportID === r.reportID
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 hover:bg-muted",
            ].join(" ")}
            onClick={() => setSelected(r)}
            title={r.reportName}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            <span className="truncate max-w-[22ch]">
              {r.reportName || "Untitled"}
            </span>
          </button>
        ))}
      </div>

      {/* Iframe */}
      <div className="flex-1 min-h-0">
        {selected?.reportURL ? (
          <iframe
            key={String(selected.reportID) + ":" + category}
            src={finalUrl}
            className="block w-full h-full"
            frameBorder={0}
            allowFullScreen
            style={{ background: "transparent" }}
          />
        ) : (
          list.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Select a report to preview.
            </div>
          )
        )}
      </div>
    </div>
  );
}

/** GRC-specific component that uses iframe with GRC-template.html */
function GRCTab({
  isActive,
  isOpen,
  bookingDetail,
}: {
  isActive: boolean;
  isOpen: boolean;
  bookingDetail: BookingType | null;
}) {
  const dispatch = useDispatch<any>();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const toast = useDrawerToast();

  const [iframeSrc, setIframeSrc] = useState<string>("about:blank");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // Get reservation data
  const reservation = useSelector(
    (state: any) => state.reservationById?.data || null
  );
  const hotelByGuid: HotelMasDTO | null =
    useSelector(selectHotelMas) || null;

  // Fetch reservation data when tab becomes active
  useEffect(() => {
    if (!isActive || !isOpen) return;
    const reservationID = bookingDetail?.reservationID;
    if (reservationID) {
      dispatch(fetchReservationById(Number(reservationID)) as any);
    }
    // Get hotelCode from localStorage, fallback to "1097"
    const hotelCode = localStorage.getItem("hotelCode") || "1097";
    dispatch(fetchHotelMasByHotelCode({ hotelCode }) as any);
  }, [isActive, isOpen, bookingDetail?.reservationID, dispatch]);

  // Set iframe src when tab becomes active
  useEffect(() => {
    if (isActive && isOpen) {
      setIframeSrc(`/template/GRC-template.html?_=${Date.now()}`);
    } else {
      setIframeSrc("about:blank");
    }
  }, [isActive, isOpen]);

  console.log("bookingDetail in GRC tab:", bookingDetail);

  // Post reservation data to iframe
  const postReservationToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target || !bookingDetail) return;

    target.postMessage(
      {
        type: "GRC_DATA",
        payload: {
          // Hotel info
          hotelName: hotelByGuid?.hotelName || "",
          hotelPhone: hotelByGuid?.phone || "",
          hotelEmail: hotelByGuid?.email || "",
          hotelLogo: stripQuery(hotelByGuid?.logoURL || ""),

          // Reservation details
          reservationNo: bookingDetail.reservationNo || "N/A",
          reservationDate: bookingDetail.reservationDate || bookingDetail.createdOn || new Date().toLocaleDateString(),

          // Room details
          roomType: bookingDetail.roomType || "N/A",
          roomNumber: bookingDetail.roomNumber || "N/A",
          adults: bookingDetail.adults || 0,
          children: bookingDetail.child || 0,
          mealPlan: bookingDetail.basis || "N/A",

          // Dates
          checkIn: bookingDetail.checkIN || "N/A",
          checkOut: bookingDetail.checkOUT || "N/A",

          // Guest info
          bookerName: bookingDetail.bookerFullName?.trim?.() || "N/A",
          phone: bookingDetail.phone || "N/A",
          email: bookingDetail.email || "N/A",
          nationality: bookingDetail.nationality || "N/A",

          // Booking reference
          bookingRef: bookingDetail.refNo || bookingDetail.tourNo || "N/A",
          agent: bookingDetail.sourceOfBooking || "N/A",

          // Terms source: ONLY from hotel; null triggers FALLBACK_TERMS in template
          grC_Para1:
            typeof hotelByGuid?.grC_Para1 === "string" &&
            hotelByGuid.grC_Para1.trim().length > 0
              ? hotelByGuid.grC_Para1
              : null,
        },
      },
      "*"
    );
  }, [bookingDetail, hotelByGuid]);

  // Post data when iframe loads or reservation/bookingDetail changes
  useEffect(() => {
    if (!isActive || (!reservation && !bookingDetail)) return;
    // Add delay to ensure iframe is ready
    const timer = setTimeout(() => {
      postReservationToIframe();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, reservation, bookingDetail, postReservationToIframe]);

  const onIframeLoad = useCallback(() => {
    // Add longer delay for iframe load to ensure DOM is ready
    setTimeout(() => {
      postReservationToIframe();
    }, 200);
  }, [postReservationToIframe]);

  // Handle email modal
  useEffect(() => {
    if (emailModalOpen) {
      setEmailTo(reservation?.email || "");
    }
  }, [emailModalOpen, reservation]);

  // Listen for events from the iframe (email trigger + update hotel)
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e?.data || typeof e.data !== "object") return;

      const type = (e.data as any).type;

      // 1) Open email modal
      if (type === "EMAIL_CLICK") {
        setEmailModalOpen(true);
        return;
      }

      // 2) Update hotel
      if (type === "UPDATE_HOTEL") {
        const payload = (e.data as any)?.payload;
        if (!payload || typeof payload !== "object") {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "UPDATE_HOTEL_RESULT",
              ok: false,
              error: "Invalid payload",
            },
            "*"
          );
          return;
        }

        dispatch(
          patchHotelGRCPara1({
            grC_Para1: String(payload?.grC_Para1 ?? ""),
          }) as any
        )
          .unwrap()
          .then(() => {
            toast.success(
              "Updated successfully",
              "Terms & Conditions updated successfully"
            );
            iframeRef.current?.contentWindow?.postMessage(
              { type: "UPDATE_HOTEL_RESULT", ok: true },
              "*"
            );
          })
          .catch((err: any) => {
            toast.error(
              "Update failed",
              `Failed to update Terms & Conditions: ${String(
                err?.message ?? err ?? "Unknown error"
              )}`
            );
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: "UPDATE_HOTEL_RESULT",
                ok: false,
                error: String(err?.message ?? err ?? "Failed"),
              },
              "*"
            );
          });
      }
    }

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [dispatch]);

  // Email functionality
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

  async function getPopulatedGRCHtmlFromIframe(
    iframe: HTMLIFrameElement | null
  ): Promise<string> {
    if (!iframe) return "";
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

  const handleSendGRCEmail = async () => {
    const email = (emailTo || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }
    try {
      setEmailSending(true);
      const html = await getPopulatedGRCHtmlFromIframe(iframeRef.current);
      const subject = `Guest Registration Card - ${
        reservation?.reservationNo ?? bookingDetail?.reservationNo ?? ""
      }`.trim();
      await dispatch(
        sendCustomEmail({ toEmail: email, subject, body: html, isHtml: true })
      ).unwrap();
      setTimeout(() => setEmailModalOpen(false), 0);
    } catch (e: any) {
      const msg =
        typeof e === "string" ? e : e?.message || "Failed to send email.";
    } finally {
      setEmailSending(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          key={String(bookingDetail?.reservationID) + "-" + String(isActive)}
          src={iframeSrc}
          title="Guest Registration Card"
          className="block w-full h-full"
          frameBorder={0}
          onLoad={onIframeLoad}
          style={{ background: "transparent" }}
        />
      </div>

      <SendEmailModal
        open={emailModalOpen}
        email={emailTo}
        onEmailChange={setEmailTo}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendGRCEmail}
        sending={emailSending}
      />
    </div>
  );
}

/** Booking Confirmation (BCONF) component that uses iframe with BConf-template.html */
function BConfTab({
  isActive,
  isOpen,
  bookingDetail,
}: {
  isActive: boolean;
  isOpen: boolean;
  bookingDetail: BookingType | null;
}) {
  const dispatch = useDispatch<any>();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const toast = useDrawerToast();

  const [iframeSrc, setIframeSrc] = useState<string>("about:blank");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const reservation = useSelector((s: any) => s.reservationById?.data || null);
  const hotelByGuid: HotelMasDTO | null =
    useSelector(selectHotelMas) || null;

  // Fetch reservation when active
  useEffect(() => {
    if (!isActive || !isOpen) return;
    const resId = bookingDetail?.reservationID;
    if (resId) {
      dispatch(fetchReservationById(Number(resId)) as any);
    }
    // Get hotelCode from localStorage, fallback to "1097"
    const hotelCode = localStorage.getItem("hotelCode") || "1097";
    dispatch(fetchHotelMasByHotelCode({ hotelCode }) as any);
  }, [isActive, isOpen, bookingDetail?.reservationID, dispatch]);

  // Set iframe src when active
  useEffect(() => {
    if (isActive && isOpen) {
      setIframeSrc(`/template/BConf-template.html?_=${Date.now()}`);
    } else {
      setIframeSrc("about:blank");
    }
  }, [isActive, isOpen]);

  // Post reservation header to iframe
  const postReservationToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target || !bookingDetail) return;

    target.postMessage(
      {
        type: "RES_HEADER",
        payload: {
          // Hotel info
          hotelName: hotelByGuid?.hotelName || "",
          hotelPhone: hotelByGuid?.phone || "",
          hotelEmail: hotelByGuid?.email || "",
          hotelLogo: stripQuery(hotelByGuid?.logoURL || ""),

          // Reservation details
          reservationNo: bookingDetail.reservationNo || "N/A",
          reservationDate: bookingDetail.reservationDate || bookingDetail.createdOn || new Date().toLocaleDateString(),

          // Room details
          roomType: bookingDetail.roomType || "N/A",
          roomNo: bookingDetail.roomNumber || "N/A",
          adults: bookingDetail.adults || 0,
          children: bookingDetail.child || 0,
          mealPlan: bookingDetail.basis || "N/A",

          // Dates
          checkIn: bookingDetail.checkIN || "N/A",
          checkOut: bookingDetail.checkOUT || "N/A",
          arrival: bookingDetail.checkIN || "N/A",
          dept: bookingDetail.checkOut || "N/A",

          // Guest info
          bookerName: bookingDetail.bookerFullName?.trim?.() || "N/A",
          phone: bookingDetail.phone || "N/A",
          email: bookingDetail.email || "N/A",
          nationality: bookingDetail.nationality || "N/A",

          // Booking reference
          bookingRef: bookingDetail.refNo || bookingDetail.tourNo || "N/A",
          agent: bookingDetail.sourceOfBooking || "N/A",
          tourNo: bookingDetail.tourNo ?? "—",
          groupName: "—", // Not available in bookingDetail, using fallback

          // Hotel policies
          ibE_CancellationPolicy: hotelByGuid?.ibE_CancellationPolicy || "",
          ibE_ChildPolicy: hotelByGuid?.ibE_ChildPolicy || "",
          ibE_TaxPolicy: hotelByGuid?.ibE_TaxPolicy || "",
        },
      },
      "*"
    );
  }, [bookingDetail, hotelByGuid]);

  // Post per-room BCONF items to iframe
  const postBconfItemsToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target || !reservation) return;

    const items = Array.isArray(reservation?.rooms)
      ? reservation.rooms.map((r: any, idx: number) => ({
          roomIndex: idx + 1,
          reservationDetailID: r?.reservationDetailID,

          roomType: r?.roomType ?? "-",
          occupancy: r?.occupancy ?? "-", // <-- use provided occupancy
          basis: r?.basis ?? "-",
          adultCount: r?.adults ?? 0,
          childCount: r?.child ?? 0,
          extraBed: r?.extraBed ?? 0,
          foc:
            typeof r?.foc === "boolean" // <-- use provided FOC boolean
              ? r.foc
                ? "Yes"
                : "No"
              : "-",
        }))
      : [];

    target.postMessage({ type: "BCONF_ITEMS", payload: { items } }, "*");
  }, [reservation]);

  // Post when iframe loads or bookingDetail changes
  useEffect(() => {
    if (!isActive || !bookingDetail) return;
    // Add delay to ensure iframe is ready
    const timer = setTimeout(() => {
      postReservationToIframe();
      postBconfItemsToIframe();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, bookingDetail, postReservationToIframe, postBconfItemsToIframe]);

  const onIframeLoad = useCallback(() => {
    // Add longer delay for iframe load to ensure DOM is ready
    setTimeout(() => {
      postReservationToIframe();
      postBconfItemsToIframe();
    }, 200);
  }, [postReservationToIframe, postBconfItemsToIframe]);

  // Email modal state sync
  useEffect(() => {
    if (emailModalOpen) {
      setEmailTo(reservation?.email || "");
    }
  }, [emailModalOpen, reservation]);

  // Listen for EMAIL_CLICK and UPDATE_POLICIES from iframe
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e?.data || typeof e.data !== "object") return;
      const { type, payload } = e.data as any;

      if (type === "EMAIL_CLICK") {
        setEmailModalOpen(true);
        return;
      }

      if (type === "UPDATE_POLICIES") {
        if (!hotelByGuid || !payload) {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "UPDATE_POLICIES_RESULT",
              ok: false,
              error: "Missing hotel data",
            },
            "*"
          );
          return;
        }

        // Create update payload with only the fields that need to be updated
        const updatedHotel = {
          hotelID: hotelByGuid.hotelID,
          ibE_CancellationPolicy: String(payload?.ibE_CancellationPolicy ?? ""),
          ibE_ChildPolicy: String(payload?.ibE_ChildPolicy ?? ""),
          ibE_TaxPolicy: String(payload?.ibE_TaxPolicy ?? ""),
          // Include other required fields from HotelMasDTO
          hotelName: hotelByGuid.hotelName,
          phone: hotelByGuid.phone,
          email: hotelByGuid.email,
          address: hotelByGuid.address || "",
        } as unknown as HotelPayload;

        dispatch(updateHotel(updatedHotel) as any)
          .unwrap()
          .then(() => {
            toast.success(
              "Updated successfully",
              "Hotel policies updated successfully"
            );
            iframeRef.current?.contentWindow?.postMessage(
              { type: "UPDATE_POLICIES_RESULT", ok: true },
              "*"
            );
          })
          .catch((err: any) => {
            toast.error(
              "Update failed",
              `Failed to update policies: ${String(
                err?.message ?? "Update failed"
              )}`
            );
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: "UPDATE_POLICIES_RESULT",
                ok: false,
                error: String(err?.message ?? "Update failed"),
              },
              "*"
            );
          });

        return;
      }
    }

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [dispatch, hotelByGuid]);

  async function getPopulatedHtmlFromIframe(
    iframe: HTMLIFrameElement | null
  ): Promise<string> {
    if (!iframe) return "";
    await new Promise((r) => setTimeout(r, 100));
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return "";
      // Remove floating actions + scripts, enforce white body like other templates
      const html = doc.documentElement.outerHTML
        .replace(/<div id=\"floating-actions[\s\S]*?<\/div>\s*/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(
          /<body(.*?)>/i,
          '<body$1 style="margin:0;padding:20px;font-family:Arial, sans-serif;font-size:12px;background-color:#ffffff;">'
        );
      return html;
    } catch {
      return "";
    }
  }

  const handleSendEmail = async () => {
    const email = (emailTo || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      setEmailSending(true);
      const html = await getPopulatedHtmlFromIframe(iframeRef.current);
      const subject = `Booking Confirmation - ${
        reservation?.reservationNo ?? bookingDetail?.reservationNo ?? ""
      }`.trim();
      await dispatch(
        sendCustomEmail({
          toEmail: email,
          subject,
          body: html,
          isHtml: true,
        }) as any
      ).unwrap();
      setTimeout(() => setEmailModalOpen(false), 0);
    } finally {
      setEmailSending(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          key={
            String(bookingDetail?.reservationID) + "-bconf-" + String(isActive)
          }
          src={iframeSrc}
          title="Booking Confirmation"
          className="block w-full h-full"
          frameBorder={0}
          onLoad={onIframeLoad}
          style={{ background: "transparent" }}
        />
      </div>
      <SendEmailModal
        open={emailModalOpen}
        email={emailTo}
        onEmailChange={setEmailTo}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        sending={emailSending}
      />
    </div>
  );
}

/** Bill-specific component that uses iframe with invoice-template.html */
function BillTab({
  isActive,
  isOpen,
  bookingDetail,
  reservationDetailID,
}: {
  isActive: boolean;
  isOpen: boolean;
  bookingDetail: BookingType | null;
  reservationDetailID?: number | string;
}) {
  const dispatch = useDispatch<any>();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [iframeSrc, setIframeSrc] = useState<string>("about:blank");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // Get folio and reservation data
  const { data: folioItems = [] } = useSelector(
    (s: any) => s.folio || { data: [] }
  );
  const reservation = useSelector((s: any) => s.reservationById?.data || null);
  const hotelByGuid: HotelMasDTO | null =
    useSelector(selectHotelMas) || null;

  // Fetch data when tab becomes active
  useEffect(() => {
    if (!isActive || !isOpen) return;
    if (reservationDetailID) {
      dispatch(
        fetchFolioByReservationDetailId(Number(reservationDetailID)) as any
      );
    }
    const resId = bookingDetail?.reservationID;
    if (resId) {
      dispatch(fetchReservationById(Number(resId)) as any);
    }
    // Get hotelCode from localStorage, fallback to "1097"
    const hotelCode = localStorage.getItem("hotelCode") || "1097";
    dispatch(fetchHotelMasByHotelCode({ hotelCode }) as any);
  }, [
    isActive,
    isOpen,
    reservationDetailID,
    bookingDetail?.reservationID,
    dispatch,
  ]);

  // Set iframe src when tab becomes active
  useEffect(() => {
    if (isActive && isOpen) {
      setIframeSrc(`/template/invoice-template.html?_=${Date.now()}`);
    } else {
      setIframeSrc("about:blank");
    }
  }, [isActive, isOpen]);

  // Post folio to iframe
  const postFolioToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    const items = (folioItems ?? []).map((it: any) => ({
      tranDate: it?.tranDate,
      tranType: it?.tranType,
      docNo: it?.docNo,
      accountName: it?.accountName,
      paymentMethod: it?.paymentMethod,
      credit: it?.credit,
      debit: it?.debit,
      amount: it?.amount,
    }));
    const total = (folioItems ?? []).reduce((s: number, it: any) => {
      const n = Number(it?.amount);
      return Number.isFinite(n) ? s + n : s;
    }, 0);
    target.postMessage(
      { type: "FOLIO_PAYLOAD", payload: { items, total } },
      "*"
    );
  }, [folioItems]);

  // Post reservation header to iframe
  const postReservationToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target || !bookingDetail) return;

    target.postMessage(
      {
        type: "BILL_DATA",
        payload: {
          // Hotel info
          hotelName: hotelByGuid?.hotelName || "",
          hotelPhone: hotelByGuid?.phone || "",
          hotelEmail: hotelByGuid?.email || "",
          hotelLogo: stripQuery(hotelByGuid?.logoURL || ""),

          // Reservation details
          reservationNo: bookingDetail.reservationNo || "N/A",
          reservationDate: bookingDetail.reservationDate || bookingDetail.createdOn || new Date().toLocaleDateString(),

          // Room details
          roomType: bookingDetail.roomType || "N/A",
          roomNo: bookingDetail.roomNumber || "N/A",
          adults: bookingDetail.adults || 0,
          children: bookingDetail.child || 0,
          mealPlan: bookingDetail.basis || "N/A",

          // Dates
          checkIn: bookingDetail.checkIN || "N/A",
          checkOut: bookingDetail.checkOUT || "N/A",
          arrival: bookingDetail.checkIN || "N/A",
          dept: bookingDetail.checkOut || "N/A",

          // Guest info
          bookerName: bookingDetail.bookerFullName?.trim?.() || "N/A",
          phone: bookingDetail.phone || "N/A",
          email: bookingDetail.email || "N/A",
          nationality: bookingDetail.nationality || "N/A",

          // Booking reference
          bookingRef: bookingDetail.refNo || bookingDetail.tourNo || "N/A",
          agent: bookingDetail.sourceOfBooking || "N/A",

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
  }, [bookingDetail, hotelByGuid]);

  // Try posting when data changes and drawer open
  useEffect(() => {
    if (!isActive || !bookingDetail) return;
    // Add delay to ensure iframe is ready
    const timer = setTimeout(() => {
      postReservationToIframe();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, bookingDetail, hotelByGuid, postReservationToIframe]);

  useEffect(() => {
    if (!isActive || !bookingDetail) return;
    // Add delay to ensure iframe is ready
    const timer = setTimeout(() => {
      postFolioToIframe();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, bookingDetail, folioItems, postFolioToIframe]);

  const onIframeLoad = useCallback(() => {
    // Add longer delay for iframe load to ensure DOM is ready
    setTimeout(() => {
      postReservationToIframe();
      postFolioToIframe();
    }, 200);
  }, [postReservationToIframe, postFolioToIframe]);

  // Email modal state sync
  useEffect(() => {
    if (emailModalOpen) {
      setEmailTo(reservation?.email || "");
    }
  }, [emailModalOpen, reservation]);

  // Listen for EMAIL_CLICK and PAY_HERE_CLICK from iframe
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e?.data || typeof e.data !== "object") return;
      const data = e.data as any;

      if (data.type === "EMAIL_CLICK") {
        setEmailModalOpen(true);
      } else if (data.type === "PAY_HERE_CLICK") {
        handlePayHereClick(data.payload);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [hotelByGuid]);

  // Handle Pay Here button click from iframe
  const handlePayHereClick = async (payload: {
    amount: string;
    reservationNo: string;
    bookingRef: string;
  }) => {
    try {
      console.log("🔄 Processing payment link request:", payload);

      // Get hotel ID from hotelByGuid or localStorage
      let hotelId = hotelByGuid?.hotelID;
      if (!hotelId) {
        const savedHotel = localStorage.getItem("selectedHotel");
        if (savedHotel) {
          const hotelData = JSON.parse(savedHotel);
          hotelId = hotelData.id;
        }
      }

      if (!hotelId) {
        console.error("❌ Hotel ID not found");
        alert("Hotel information not available. Please try again.");
        return;
      }

      if (!payload.amount || parseFloat(payload.amount) <= 0) {
        console.error("❌ Invalid payment amount:", payload.amount);
        alert("Invalid payment amount. Please refresh and try again.");
        return;
      }

      // Get access token from localStorage
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;

      if (!accessToken) {
        console.error("❌ Access token not found");
        alert("Authentication required. Please login again.");
        return;
      }

      // Call payment link API
      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotelId: hotelId,
          amount: payload.amount,
          currency: "USD", // Default to USD for now
          reservationNo: payload.reservationNo || payload.bookingRef,
          productName: `Hotel Invoice Payment - ${
            payload.reservationNo || payload.bookingRef || "Invoice"
          }`,
          token: accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment link");
      }

      const paymentData = await response.json();

      console.log("✅ Payment form data received:", paymentData);

      // Create and submit payment form using Secure Acceptance
      if (paymentData.paymentUrl && paymentData.formFields) {
        // Create form element
        const form = document.createElement("form");
        form.method = "POST";
        form.action = paymentData.paymentUrl;
        form.target = "_blank"; // Open in new window
        form.style.display = "none";

        // Add all form fields
        Object.entries(paymentData.formFields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Submit form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log("🚀 Payment form submitted successfully");
      } else {
        throw new Error("Payment form data not received from server");
      }
    } catch (error) {
      console.error("❌ Payment link error:", error);
      alert(
        `Failed to create payment link: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  function sanitizeForEmail(html: string): string {
    const withoutFab = html.replace(
      /<div id=\"floating-actions[\s\S]*?<\/div>\s*/i,
      ""
    );
    const withoutScripts = withoutFab.replace(
      /<script[\s\S]*?<\/script>/gi,
      ""
    );
    return withoutScripts.replace(
      /<body(.*?)>/i,
      '<body$1 style="margin:0;padding:20px;font-family:Arial, sans-serif;font-size:12px;background-color:#ffffff;">'
    );
  }

  async function getPopulatedInvoiceHtmlFromIframe(
    iframe: HTMLIFrameElement | null
  ): Promise<string> {
    if (!iframe) return "";
    await new Promise((r) => setTimeout(r, 100));
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
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      setEmailSending(true);
      const html = await getPopulatedInvoiceHtmlFromIframe(iframeRef.current);
      const subject = `Invoice #${
        reservation?.reservationNo ?? bookingDetail?.reservationNo ?? ""
      }`.trim();
      await dispatch(
        sendCustomEmail({
          toEmail: email,
          subject,
          body: html,
          isHtml: true,
        }) as any
      ).unwrap();
      setTimeout(() => setEmailModalOpen(false), 0);
    } finally {
      setEmailSending(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          key={
            String(bookingDetail?.reservationID) + "-bill-" + String(isActive)
          }
          src={iframeSrc}
          title="Invoice"
          className="block w-full h-full"
          frameBorder={0}
          onLoad={onIframeLoad}
          style={{ background: "transparent" }}
        />
      </div>
      <SendEmailModal
        open={emailModalOpen}
        email={emailTo}
        onEmailChange={setEmailTo}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendInvoiceEmail}
        sending={emailSending}
      />
    </div>
  );
}

/** Performa-specific component that uses iframe with performa-template.html */
function PerformaTab({
  isActive,
  isOpen,
  bookingDetail,
  reservationDetailID,
}: {
  isActive: boolean;
  isOpen: boolean;
  bookingDetail: BookingType | null;
  reservationDetailID?: number | string;
}) {
  const dispatch = useDispatch<any>();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [iframeSrc, setIframeSrc] = useState<string>("about:blank");

  const rateDetails = useSelector(selectReservationRateDetails);
  const reservation = useSelector((s: any) => s.reservationById?.data || null);
  const hotelByGuid: HotelMasDTO | null =
    useSelector(selectHotelMas) || null;

  // Fetch data when tab becomes active
  useEffect(() => {
    if (!isActive || !isOpen) return;
    if (reservationDetailID) {
      dispatch(fetchReservationRateDetails({ reservationDetailId: Number(reservationDetailID) }) as any);
    }
    const resId = bookingDetail?.reservationID;
    if (resId) dispatch(fetchReservationById(Number(resId)) as any);
    // Get hotelCode from localStorage, fallback to "1097"
    const hotelCode = localStorage.getItem("hotelCode") || "1097";
    dispatch(fetchHotelMasByHotelCode({ hotelCode }) as any);
  }, [
    isActive,
    isOpen,
    reservationDetailID,
    bookingDetail?.reservationID,
    dispatch,
  ]);

  // Set iframe src when tab becomes active
  useEffect(() => {
    if (isActive && isOpen) {
      setIframeSrc(`/template/performa-template.html?_=${Date.now()}`);
    } else {
      setIframeSrc("about:blank");
    }
  }, [isActive, isOpen]);

  const postRateDetailsToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    const items = (rateDetails ?? []).map((r: any) => ({
      rateDate: r?.dt, // Using 'dt' field from reservationRateDetailSlice
      roomRate: r?.roomRate,
      discount: r?.discount,
      childRate: r?.childRate,
      exBedRate: r?.exBedRate,
      suppliment: r?.suppliment,
      netRate: r?.netRate,
      currencyCode: r?.currencyCode,
    }));
    const totalNet = (rateDetails ?? []).reduce(
      (s: number, r: any) => s + Number(r?.netRate || 0),
      0
    );
    target.postMessage(
      { type: "RATE_DETAILS_PAYLOAD", payload: { items, total: totalNet } },
      "*"
    );
  }, [rateDetails]);

  const postReservationToIframe = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target || !bookingDetail) return;

    target.postMessage(
      {
        type: "RES_HEADER",
        payload: {
          // Hotel info
          hotelName: hotelByGuid?.hotelName || "",
          hotelPhone: hotelByGuid?.phone || "",
          hotelEmail: hotelByGuid?.email || "",
          hotelLogo: stripQuery(hotelByGuid?.logoURL || ""),

          // Reservation details
          reservationNo: bookingDetail.reservationNo || "N/A",
          reservationDate: bookingDetail.reservationDate || bookingDetail.createdOn || new Date().toLocaleDateString(),

          // Room details
          roomType: bookingDetail.roomType || "N/A",
          roomNo: bookingDetail.roomNumber || "N/A",
          adults: bookingDetail.adults || 0,
          children: bookingDetail.child || 0,
          mealPlan: bookingDetail.basis || "N/A",

          // Dates
          checkIn: bookingDetail.checkIN || "N/A",
          checkOut: bookingDetail.checkOUT || "N/A",
          arrival: bookingDetail.checkIN || "N/A",
          dept: bookingDetail.checkOut || "N/A",

          // Guest info
          bookerName: bookingDetail.bookerFullName?.trim?.() || "N/A",
          phone: bookingDetail.phone || "N/A",
          email: bookingDetail.email || "N/A",
          nationality: bookingDetail.nationality || "N/A",

          // Booking reference
          bookingRef: bookingDetail.refNo || bookingDetail.tourNo || "N/A",
          agent: bookingDetail.sourceOfBooking || "N/A",

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
  }, [bookingDetail, hotelByGuid]);

  useEffect(() => {
    if (!isActive || !bookingDetail) return;
    // Add delay to ensure iframe is ready
    const timer = setTimeout(() => {
      postReservationToIframe();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, bookingDetail, hotelByGuid, postReservationToIframe]);

  useEffect(() => {
    if (!isActive || !bookingDetail) return;
    // Add delay to ensure iframe is ready
    const timer = setTimeout(() => {
      postRateDetailsToIframe();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, bookingDetail, rateDetails, postRateDetailsToIframe]);

  const onIframeLoad = useCallback(() => {
    // Add longer delay for iframe load to ensure DOM is ready
    setTimeout(() => {
      postReservationToIframe();
      postRateDetailsToIframe();
    }, 200);
  }, [postReservationToIframe, postRateDetailsToIframe]);

  // Listen for PAY_HERE_CLICK from iframe
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e?.data || typeof e.data !== "object") return;
      const data = e.data as any;

      if (data.type === "PAY_HERE_CLICK") {
        handlePayHereClick(data.payload);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [hotelByGuid]);

  // Handle Pay Here button click from iframe
  const handlePayHereClick = async (payload: {
    amount: string;
    reservationNo: string;
    bookingRef: string;
  }) => {
    try {
      console.log("🔄 Processing payment link request (Performa):", payload);

      // Get hotel ID from hotelByGuid or localStorage
      let hotelId = hotelByGuid?.hotelID;
      if (!hotelId) {
        const savedHotel = localStorage.getItem("selectedHotel");
        if (savedHotel) {
          const hotelData = JSON.parse(savedHotel);
          hotelId = hotelData.id;
        }
      }

      if (!hotelId) {
        console.error("❌ Hotel ID not found");
        alert("Hotel information not available. Please try again.");
        return;
      }

      if (!payload.amount || parseFloat(payload.amount) <= 0) {
        console.error("❌ Invalid payment amount:", payload.amount);
        alert("Invalid payment amount. Please refresh and try again.");
        return;
      }

      // Get access token from localStorage
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;

      if (!accessToken) {
        console.error("❌ Access token not found");
        alert("Authentication required. Please login again.");
        return;
      }

      // Call payment link API
      const response = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotelId: hotelId,
          amount: payload.amount,
          currency: "USD", // Default to USD for now
          reservationNo: payload.reservationNo || payload.bookingRef,
          productName: `Hotel Performa Payment - ${
            payload.reservationNo || payload.bookingRef || "Performa"
          }`,
          token: accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment link");
      }

      const paymentData = await response.json();

      console.log("✅ Payment form data received (Performa):", paymentData);

      // Create and submit payment form using Secure Acceptance
      if (paymentData.paymentUrl && paymentData.formFields) {
        // Create form element
        const form = document.createElement("form");
        form.method = "POST";
        form.action = paymentData.paymentUrl;
        form.target = "_blank"; // Open in new window
        form.style.display = "none";

        // Add all form fields
        Object.entries(paymentData.formFields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Submit form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log("🚀 Performa payment form submitted successfully");
      } else {
        throw new Error("Payment form data not received from server");
      }
    } catch (error) {
      console.error("❌ Performa payment link error:", error);
      alert(
        `Failed to create payment link: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          key={
            String(bookingDetail?.reservationID) +
            "-performa-" +
            String(isActive)
          }
          src={iframeSrc}
          title="Proforma"
          className="block w-full h-full"
          frameBorder={0}
          onLoad={onIframeLoad}
          style={{ background: "transparent" }}
        />
      </div>
    </div>
  );
}

export function ReportsDrawer({
  isOpen,
  onClose,
  bookingDetail,
  reservationDetailID,
}: DrawerProps) {
  const dispatch = useDispatch<any>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("grc"); // initial GRC

  // Read hotelCode for CR engine URLs
  const hotelCode = useMemo<number | undefined>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedProperty")
          : null;
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) || {};
      return parsed?.hotelCode as number | undefined;
    } catch {
      return undefined;
    }
  }, []);

  // Pre-compute counts from store (no fetching here)
  const counts = {
    // GRC uses a local HTML template (no API-backed ReportMaster list)
    grc: 1,
    bconf:
      (useSelector((s: any) => selectReportsByCategory(s, "BCONF")) as Report[])
        ?.length || 0,
    // Proforma uses local template
    proforma: 1,
    // Bill uses local invoice template
    bill: 1,
  } as const;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <SheetContent
        side="right"
        className={[
          "z-[70] transition-all duration-300 p-0",
          "flex h-full flex-col",
          isFullscreen
            ? "fixed inset-0 w-full sm:max-w-[96vw] md:max-w-[85vw] lg:max-w-[100vw] max-w-none rounded-none"
            : "w-full sm:max-w-[96vw] md:max-w-[85vw] lg:max-w-[75vw] rounded-l-2xl",
        ].join(" ")}
      >
        {/* Controls */}
        <div className="absolute top-2 right-2 z-50 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsFullscreen((v) => !v)}
            className="rounded-full"
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="rounded-full"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <SheetHeader className="px-4 pt-4 pb-0" />

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabKey)}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TabsList className="bg-background/80 backdrop-blur w-full p-1 border rounded-none overflow-x-auto no-scrollbar flex gap-1 sm:gap-2 sticky top-0 z-10">
            {TABS.map(({ key, label }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="snap-start min-w-[7.5rem] sm:min-w-0 sm:flex-1 sm:basis-0 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted/40 text-sm font-medium h-10 inline-flex items-center justify-center gap-2"
                >
                  <span>{label}</span>
                  <span className="rounded-full text-xs px-2 py-0.5 border bg-muted/50">
                    {counts[key as keyof typeof counts]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Panels: each panel fetches its own category WHEN ACTIVE */}
            {TABS.map(({ key, category }) => (
              <TabsContent key={key} value={key} className="flex-1 min-h-0">
                {key === "grc" ? (
                  <GRCTab
                    isActive={activeTab === key}
                    isOpen={isOpen}
                    bookingDetail={bookingDetail}
                  />
                ) : key === "bconf" ? (
                  <BConfTab
                    isActive={activeTab === key}
                    isOpen={isOpen}
                    bookingDetail={bookingDetail}
                  />
                ) : key === "proforma" ? (
                  <PerformaTab
                    isActive={activeTab === key}
                    isOpen={isOpen}
                    bookingDetail={bookingDetail}
                    reservationDetailID={reservationDetailID}
                  />
                ) : key === "bill" ? (
                  <BillTab
                    isActive={activeTab === key}
                    isOpen={isOpen}
                    bookingDetail={bookingDetail}
                    reservationDetailID={reservationDetailID}
                  />
                ) : (
                  <ReportTab
                    category={category}
                    isActive={activeTab === key}
                    isOpen={isOpen}
                    hotelCode={hotelCode}
                    bookingDetail={bookingDetail}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </SheetContent>
    </Sheet>
  );
}
