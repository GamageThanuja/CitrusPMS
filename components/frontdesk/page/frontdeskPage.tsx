"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Plus,
  UserPlus,
  ChevronLeftCircle,
  ChevronRightCircle,
  LayoutGrid,
  List,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useTranslatedText } from "@/lib/translation";
import {
  format,
  addDays,
  differenceInCalendarDays,
  isSameDay,
  startOfDay,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  startSignalRConnection,
  stopSignalRConnection,
} from "@/lib/SignalRService";

import WalkInDrawer from "@/components/drawers/WalkInDrawer";
import ReservationDrawer from "@/components/drawers/ReservationDrawer";
import BookingDetailsDrawer from "@/components/drawers/booking-details-drawer";
import QuickReservationDrawer from "@/components/drawers/QuickReservationDrawer";
import GridLayout from "../../../app/reservation/front-desk/grid-layout";
import ArrivalsTab from "@/components/frontdesk/tabs/ArrivalsTab";
import DeparturesTab from "@/components/frontdesk/tabs/DeparturesTab";
import InHouseTab from "@/components/frontdesk/tabs/InHouseTab";
import ConfirmedTab from "@/components/frontdesk/tabs/ConfirmedTab";
import TentativeTab from "@/components/frontdesk/tabs/TentativeTab";
import AllReservationsTab from "@/components/frontdesk/tabs/AllReservationsTab";
import OtherTab from "@/components/frontdesk/tabs/OtherTab";
import { useSignalR } from "@/lib/SignalRContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomMas } from "@/redux/slices/roomMasSlice";
import { fetchRoomTypeMas } from "@/redux/slices/roomTypeMasSlice";
import CreateRoomTypeModal from "@/components/modals/createRoomTypeModal";
import { useClientStorage } from "@/hooks/useClientStorage";
import { useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { RootState } from "@/redux/store";
import { fetchFrontDesk } from "@/redux/slices/frontdeskSlice";
import BusinessBlockDrawer from "@/components/drawers/business-block-drawer";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";


export default function FrontDeskPage() {
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
  const [walkInDrawerOpen, setWalkInDrawerOpen] = useState(false);
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [viewType, setViewType] = useState<string>("card");
  const [activeTab, setActiveTab] = useState("front-desk");
  const dispatch = useDispatch();
  const lastReservationsKeyRef = useRef<string>("");
  const [debouncedResKey, setDebouncedResKey] = useState<string>(""); // debounce trigger

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "frontdesk",
    "viewAllGuest"
  );

  console.log("videoUrl : ", videoUrl);

  const [quickPrefill, setQuickPrefill] = useState<{
    roomId?: string;
    roomNumber?: string;
    roomTypeId?: string;
    roomTypeName?: string;
    checkIn?: Date;
    checkOut?: Date;
  } | null>(null);

  const handleSelectRange = useCallback(
    ({ roomId, roomNumber, roomTypeId, roomTypeName, startDate, endDate }) => {
      setQuickPrefill({
        roomId,
        roomNumber,
        roomTypeId,
        roomTypeName,
        checkIn: startDate,
        checkOut: endDate,
      });
      setQuickReservationDrawerOpen(true);
    },
    []
  );
  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  function ymd(val: any): string {
    if (!val) return "";
    if (typeof val === "string") {
      const m = val.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return format(d, "yyyy-MM-dd");
  }
  const dayEq = (a: any, b: any) => ymd(a) === ymd(b);
  const dayLe = (a: any, b: any) => ymd(a) <= ymd(b);
  const dayGt = (a: any, b: any) => ymd(a) > ymd(b);

  function normStatus(raw?: string) {
    const s = (raw || "").toLowerCase().trim();
    if (["checked-in", "in-house"].includes(s)) return "checked-in";
    if (["checked-out"].includes(s)) return "checked-out";
    if (
      ["confirmed reservation", "confirmed", "confirmed-reservation"].includes(
        s
      )
    )
      return "confirmed";
    if (["tentative"].includes(s)) return "tentative";
    if (
      [
        "no show",
        "no-show",
        "no-show without charge",
        "no-show-without-charge",
      ].includes(s)
    )
      return "no-show";
    if (["cancelled", "canceled"].includes(s)) return "cancelled";
    return s || "unknown";
  }
  const getCI = (b: any) => b.checkInRaw ?? b.resCheckIn ?? b.checkIn;
  const getCO = (b: any) => b.checkOutRaw ?? b.resCheckOut ?? b.checkOut;

  const { hotelId, accessToken } = useClientStorage();

  // Prevent drawer re-renders by tracking state changes
  const isDrawerStateChanging = useRef(false);

  // Create memoized state setters to prevent re-renders
  const setBookingDrawerOpenSafe = (open: boolean) => {
    if (!isDrawerStateChanging.current) {
      isDrawerStateChanging.current = true;
      setBookingDrawerOpen(open);
      // Reset flag after state has likely updated
      setTimeout(() => {
        isDrawerStateChanging.current = false;
      }, 100);
    }
  };

  const { onReservationUpdate } = useSignalR();

  console.log("Front Desk Page Rendered", onReservationUpdate);

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  const systemDateLoadingOnce = useRef(false);
  useEffect(() => {
    // Skip if we already have a value or we're already loading in this mount
    if (systemDate || systemDateLoadingOnce.current) return;
    systemDateLoadingOnce.current = true;
    dispatch(fetchSystemDate());
  }, [dispatch, systemDate]);

  const systemToday = useMemo(() => {
    return systemDate
      ? startOfDay(new Date(systemDate))
      : startOfDay(new Date());
  }, [systemDate]);

  const userPickedDateRef = useRef(false);
  // make sure we only initialize from system date once
  const didInitFromSystemDate = useRef(false);

  const [quickReservationDrawerOpen, setQuickReservationDrawerOpen] =
    useState(false);
  const [businessDrawerOpen, setBusinessDrawerOpen] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Room types state and effect for fetching room types
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  const [bookings, setBookings] = useState<any[]>([]);
  const [roomAvailability, setRoomAvailability] = useState<any[]>([]);
  const [createRoomTypeModalOpen, setCreateRoomTypeModalOpen] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [qrInitial, setQrInitial] = useState<
    | {
        roomId?: string;
        roomNumber?: string;
        checkIn?: Date;
        checkOut?: Date;
      }
    | undefined
  >();

  // add near other helpers

  function safeFormatDate(dateInput: any, formatStr: string): string {
    if (!dateInput) return "--";
    const d = new Date(dateInput);
    return !isNaN(d.getTime()) ? format(d, formatStr) : "--";
  }

  // ----------------------------------------------------------------
  // 4a) Date Range Setup
  // ----------------------------------------------------------------
  const [daysCount, setDaysCount] = useState<number>(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? 5 : 15
  );
  // Use the current date as the default center date
  const [centerDate, setCenterDate] = useState(new Date());

  const offset = useMemo(() => (daysCount === 7 ? 3 : 7), [daysCount]);
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const endDate = useMemo(
    () => addDays(startDate, daysCount - 1),
    [startDate, daysCount]
  );

  const dates = useMemo(() => {
    if (!daysCount) return [];
    return Array.from({ length: daysCount }, (_, i) => addDays(startDate, i));
  }, [daysCount, startDate]);
  // Fetch reservations function, moved out of useEffect for SignalR access

  const [reservation, setReservation] = useState([]);
  const frontdeskData = useAppSelector((s: RootState) => s.frontdesk?.data || []);
  useEffect(() => {
    setReservation(Array.isArray(frontdeskData) ? frontdeskData : []);
  }, [frontdeskData]);

  const fetchReservations = useCallback(async () => {
    if (typeof window === "undefined") return;

    const hotelCode = localStorage.getItem("hotelCode");
    if (!hotelCode) {
      console.warn("front-desk: missing hotelCode; skipping fetchReservations");
      return;
    }

    const checkIn = format(endDate, "MM/dd/yyyy");
    const checkOut = format(startDate, "MM/dd/yyyy");

    try {
      // Use Redux thunk instead of inline axios
      await (dispatch as any)(
        fetchFrontDesk({
          hotelCode,
          checkIn,
          checkOut,
        })
      );
    } catch (err: any) {
      console.error("Failed to fetch reservation summary via slice:", err);
    }
  }, [dispatch, startDate, endDate]);

  console.log("bookings front desk with date", reservation);

  console.log("booking front desk", bookings);

  const systemHotelDay = useMemo(() => ymd(systemToday), [systemToday]);

  const arrivalBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const status = normStatus(b.status ?? b.reservationStatus);
        const isToday = dayEq(getCI(b), systemHotelDay);
        const excluded = [
          "checked-in",
          "checked-out",
          "cancelled",
          "no-show",
        ].includes(status);
        return isToday && !excluded;
      }),
    [bookings, systemHotelDay]
  );

  const departureBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const status = normStatus(b.status ?? b.reservationStatus);
        const isToday = dayEq(getCO(b), systemHotelDay);
        const excluded = ["cancelled", "no-show"].includes(status);
        return isToday && !excluded;
      }),
    [bookings, systemHotelDay]
  );

  const inHouseBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const status = normStatus(b.status ?? b.reservationStatus);
        if (status !== "checked-in") return false; // must be actually checked-in
        const ci = getCI(b),
          co = getCO(b);
        if (!ci || !co) return false;
        return dayLe(ci, systemHotelDay) && dayGt(co, systemHotelDay); // CI ≤ today < CO
      }),
    [bookings, systemHotelDay]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hotelId || !debouncedResKey) return;

    if (lastReservationsKeyRef.current === debouncedResKey) {
      // identical consecutive request => skip
      return;
    }
    lastReservationsKeyRef.current = debouncedResKey;

    fetchReservations();
  }, [hotelId, debouncedResKey, fetchReservations]);

  const inFlightAvailability = useRef<AbortController | null>(null);
  const lastAvailKeyRef = useRef<string>("");
  const [debouncedAvailKey, setDebouncedAvailKey] = useState<string>("");

  useEffect(() => {
    const startDateStr = format(startDate, "MM/dd/yyyy");
    const endDateStr = format(endDate, "MM/dd/yyyy");
    const key = `${startDateStr}-${endDateStr}`;
    const t = setTimeout(() => setDebouncedAvailKey(key), 200);
    return () => clearTimeout(t);
  }, [startDate, endDate]);

  function getJwtExpSeconds(token?: string) {
    try {
      if (!token) return 0;
      const [, payload] = token.split(".");
      const json = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      return Number(json.exp || 0);
    } catch {
      return 0;
    }
  }

  useEffect(() => {
    const fromDash = format(startDate, "MM/dd/yyyy");
    const toDash = format(endDate, "MM/dd/yyyy");
    const key = `${hotelId || "no-hotel"}|${fromDash}-${toDash}`;
    const t = setTimeout(() => setDebouncedResKey(key), 200); // debounce 200ms
    return () => clearTimeout(t);
  }, [hotelId, startDate, endDate]);

  function transformReservationsToBookings(
    reservations: any[],
    roomTypes: any[]
  ) {
    const flatRooms = roomTypes.flatMap((t: any) => t.rooms || []);
    return reservations.map((r: any) => {
      // Map API response fields to expected field names
      const checkIn = new Date(r.checkIN || r.checkIn);
      const checkOut = new Date(r.checkOUT || r.checkOut);
      const nights = differenceInCalendarDays(checkOut, checkIn);

      const roomId = r.roomID?.toString() || r.roomId?.toString() || "";
      console.log(
        `Processing reservation for roomID: ${roomId}, flatRooms:`,
        flatRooms
      );
      const baseRate = flatRooms.find((x: any) => x.id === roomId)?.rate ?? 0;
      const total = baseRate * nights;

      return {
        id: `${r.id}-${r.refNo}-${roomId}-${r.checkIN || r.checkIn}`,
        guestName: r.guest1 || r.bookerFullName || "Guest",
        checkIn,
        checkOut,
        status: r.reservationStatus?.toLowerCase() || "unknown",
        statusColor: r.reservationStatusColour || "#ccc",
        amount: `${r.currencyCode || "USD"} ${total.toFixed(2)}`,
        guests: (r.adults || 0) + (r.child || 0),
        roomId,
        reservationDetailID:
          r.reservationDetailID || r.reservationDetailID2 || r.id,
        roomNumber: r.roomNumber || r.roomNo,
        roomType: r.roomType,
        phone: r.phone,
        email: r.email,
        reservationID: r.id,
        reservationNo: r.refNo,
        statusRaw: r.reservationStatus,
        reservationType: r.type,
        bookerFullName: r.guest1 || r.bookerFullName,
        refNo: r.refNo,
        hotelID: r.hotelCode,
        resCheckIn: r.checkIN || r.checkIn,
        resCheckOut: r.checkOUT || r.checkOut,
        totalNights: nights,
        totalRooms: 1,
        totalAmount: total,
        currencyCode: r.currencyCode,
        sourceOfBooking: r.travelAgent || r.name,
        isCancelled: false,
        basis: r.basis,
        reservationStatus: r.reservationStatus,
        reservationStatusID: r.reservationStatusID,
        reservationStatusColour:
          r.reservationStatusColour || r.reservationStatusColor || "#ccc",
        linkTo: r.linkTo,
        roomByFolioId: r.roomByFolioId,
        reservationDetailId:
          r.reservationDetailID || r.reservationDetailID2 || r.id,
        agentLogoURL: r.agentLogoURL || "",
        checkInRaw: r.checkIN || r.checkIn,
        checkOutRaw: r.checkOUT || r.checkOut,
      };
    });
  }

  useEffect(() => {
    console.log("Raw reservation data:", reservation);
    console.log("Room types:", roomTypes);
    const transformedBookings = transformReservationsToBookings(
      reservation,
      roomTypes
    );
    console.log("Transformed bookings:", transformedBookings);
    setBookings(transformedBookings);
  }, [reservation, roomTypes]);

  // Note: roomAvailability is now set to empty array since frontdesk API returns reservations, not availability
  // If availability data is needed, it should come from a different endpoint

  // Removed fetchAvailability useEffect hooks since we're using fetchReservations for all data

  const roomMasData = useSelector((state: any) => state.roomMas?.items || []);
  const roomMasLoading = useSelector(
    (state: any) => state.roomMas?.loading || false
  );
  const roomMasError = useSelector((state: any) => state.roomMas?.error);

  const roomTypeMasData = useSelector(
    (state: any) => state.roomTypeMas?.items || []
  );
  const roomTypeMasLoading = useSelector(
    (state: any) => state.roomTypeMas?.loading || false
  );
  const roomTypeMasError = useSelector(
    (state: any) => state.roomTypeMas?.error
  );

  useEffect(() => {
    if (roomMasData?.length || roomMasLoading) return; // already loaded or in-flight
    dispatch(fetchRoomMas());
  }, [dispatch, roomMasData?.length, roomMasLoading]);

  useEffect(() => {
    if (roomTypeMasData?.length || roomTypeMasLoading) return; // already loaded or in-flight
    dispatch(fetchRoomTypeMas());
  }, [dispatch, roomTypeMasData?.length, roomTypeMasLoading]);

  console.log("roomMasData : ", roomMasData);
  console.log("roomTypeMasData : ", roomTypeMasData);

  useEffect(() => {
    if (
      !roomMasLoading &&
      !roomTypeMasLoading &&
      roomMasData.length > 0 &&
      roomTypeMasData.length > 0
    ) {
      // Create a map of roomTypeID to roomType info for quick lookup
      const roomTypeMap = roomTypeMasData.reduce(
        (acc: Record<number, any>, roomType: any) => {
          acc[roomType.roomTypeID] = roomType;
          return acc;
        },
        {}
      );

      const groupedByType = Object.values(
        roomMasData.reduce((acc: Record<number, any>, curr: any) => {
          const roomType = roomTypeMap[curr.roomTypeID];
          if (!roomType) return acc; // Skip if room type not found

          if (!acc[curr.roomTypeID]) {
            acc[curr.roomTypeID] = {
              id: curr.roomTypeID.toString(),
              name: roomType.roomType,
              rooms: [],
            };
          }
          acc[curr.roomTypeID].rooms.push({
            id: curr.roomID.toString(),
            number: curr.roomNumber,
            rate: 0,
            housekeepingStatus: curr.houseKeepingStatusID
              ? `Status ${curr.houseKeepingStatusID}`
              : "Not Set",
          });
          return acc;
        }, {})
      );

      setRoomTypes(groupedByType);
    }
  }, [roomMasData, roomMasLoading, roomTypeMasData, roomTypeMasLoading]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReservationRefresh = useCallback(() => {
    if (refreshTimerRef.current) return; // already scheduled
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      // force a refresh by clearing last key so effect runs
      lastReservationsKeyRef.current = "";
      fetchReservations();
    }, 500);
  }, [fetchReservations]);

  useEffect(() => {
    const unsubscribe = onReservationUpdate?.(scheduleReservationRefresh);
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [onReservationUpdate, scheduleReservationRefresh]);

  // Also update handleExtendedOptimistic to coalesce with the same scheduler:
  const handleExtendedOptimistic = useCallback(
    (payload: {
      reservationDetailIDs: number[];
      newCheckOutISO: string;
      rate: number;
      currencyCode: string;
    }) => {
      const newCheckOut = new Date(payload.newCheckOutISO);
      setBookings((prev) =>
        prev.map((b) => {
          if (
            !payload.reservationDetailIDs.includes(
              Number(b.reservationDetailID)
            )
          )
            return b;
          const nights = differenceInCalendarDays(
            newCheckOut,
            new Date(b.checkIn)
          );
          return {
            ...b,
            checkOut: newCheckOut,
            totalNights: nights,
            amount: b.currencyCode
              ? `${b.currencyCode} ${(payload.rate * nights).toFixed(2)}`
              : `$${(payload.rate * nights).toFixed(2)}`,
          };
        })
      );
      scheduleReservationRefresh();
    },
    [scheduleReservationRefresh]
  );

  // then pass this down where your ExtendDrawer is used (likely inside BookingDetailsDrawer)
  // e.g., <ExtendDrawer onExtend={handleExtendedOptimistic} ... />

  const gridRef = useRef<HTMLDivElement>(null);
  const [dayColWidth, setDayColWidth] = useState(0);
  const fixedColWidth = 180;
  const headerHeight = 48;
  const rowHeight = 6;
  const bookingBlockHeight = 24;

  useEffect(() => {
    function updateWidth() {
      if (gridRef.current) {
        const totalWidth = gridRef.current.clientWidth - fixedColWidth;
        setDayColWidth(totalWidth / dates.length);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [dates.length]);

  useEffect(() => {
    if (
      activeTab === "front-desk" &&
      !roomMasLoading &&
      !roomTypeMasLoading &&
      roomTypes.length === 0
    ) {
      setCreateRoomTypeModalOpen(true);
    } else {
      setCreateRoomTypeModalOpen(false);
    }
  }, [activeTab, roomTypes, roomMasLoading, roomTypeMasLoading]);

  // ----------------------------------------------------------------
  // 4b) Basic Text Strings & Filtering
  // ----------------------------------------------------------------
  const frontDesk = useTranslatedText("Front Desk");
  const newReservationText = useTranslatedText("Reservation Link");
  const walkIn = useTranslatedText("Walk-in");
  const arrivalsText = useTranslatedText("Arrivals");
  const departuresText = useTranslatedText("Departures");
  const allText = useTranslatedText("All");

  // Filter for timeline overlays (date range based)
  const timelineBookings = bookings.filter((b) => {
    if (!b.checkIn || !b.checkOut) return false;

    const bookingStart = startOfDay(b.checkIn);
    const bookingEnd = startOfDay(b.checkOut);
    const gridStart = startOfDay(startDate);
    const gridEnd = startOfDay(endDate);

    return bookingStart <= gridEnd && bookingEnd >= gridStart;
  });

  // Tabs filtering for different statuses
  const today = systemToday;

  const allBookings = bookings;
  const dnrBookings = bookings.filter(
    (b) =>
      b.status === "dnr" &&
      b.checkIn &&
      startOfDay(b.checkIn) >= startOfDay(startDate) &&
      startOfDay(b.checkIn) <= startOfDay(endDate)
  );
  const noShowBookings = bookings.filter(
    (b) => b.status === "no show" || b.status === "no-show without charge"
  );
  const checkedOutBookings = bookings.filter((b) => b.status === "checked-out");
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "confirmed-reservation"
  );
  const tentativeBookings = bookings.filter((b) => b.status === "tentative");
  // Filtered list for checked-in bookings
  const checkedInBookings = bookings.filter((b) => b.status === "checked-in");
  // Cancelled bookings
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  // ----------------------------------------------------------------
  // 4c) Summaries
  // ----------------------------------------------------------------

  console.log("bookings front desk wwwwwwwwwwwwwwwwwwwwww", bookings);

  const handleReservationClick = (booking: any) => {
    console.log("handleReservationClick", booking);
    console.log("booking handleReservationClick", booking);

    const flatRooms = roomTypes.flatMap((type) => type.rooms);
    const room = flatRooms.find((r) => r.id === booking.roomId);
    const nights = differenceInCalendarDays(booking.checkOut, booking.checkIn);
    const baseRate = room?.rate ?? 0;
    const baseAmount = baseRate * nights;
    const expenseTotal = (booking.expenses || []).reduce(
      (acc: number, e: { amount?: number }) => acc + (e.amount || 0),
      0
    );
    const total = baseAmount + expenseTotal;

    // Log reservationID and reservationDetailID on click
    console.log("Clicked Booking details 0000000:", {
      reservationID: booking.reservationID,
      reservationDetailID: booking.reservationDetailID,
      reservationNo: booking.reservationNo,
      guestName: booking.guestName,
      guest_remarks: booking.remarks_Guest,
      internal_remarks: booking.remarks_Internal,

    });

    // Logging the parsed booking object and key values
    console.log("Parsed booking for drawer:", {
      guest: booking.guestName,
      status: booking.status,
      reservationStatus: booking.reservationStatus,
      reservationStatusID: booking.reservationStatusID,
      reservationStatusColour: booking.statusColor,
      fullData: booking,
    });

    // Create a processed booking object with all needed fields
    const processedBooking = {
      ...booking,
      guest: booking.guestName,
      roomType: roomTypes.find((t) =>
        t.rooms.some((r: { id: string }) => r.id === booking.roomId)
      )?.name,
      roomNumber: room?.number,
      checkIn: booking.checkIn
        ? format(booking.checkIn, "MMM d, yyyy, hh:mm a")
        : "",
      checkOut: booking.checkOut
        ? format(booking.checkOut, "MMM d, yyyy, hh:mm a")
        : undefined,
      amount: `$${total.toFixed(2)}`,
      nights: booking.checkOut
        ? differenceInCalendarDays(booking.checkOut, booking.checkIn)
        : undefined,
      status: booking.status, // Explicitly include status
      statusColor: booking.statusColor, // Add statusColor field
      // Added reservationStatusMaster details explicitly after statusColor
      reservationStatus: booking.reservationStatus,
      reservationStatusID: booking.reservationStatusID,
      reservationStatusColour:
        booking.reservationStatusColour || booking.statusColor || "#ccc",
      guests: booking.guests,
      phone: booking.phone ?? "",
      email: booking.email ?? "",
      idType: booking.idType ?? "",
      idNumber: booking.idNumber ?? "",
      expenses: booking.expenses ?? [],
      revisions: booking.revisions ?? [],
      notes: booking.notes ?? [],
      reservationID: booking.reservationID,
      reservationDetailID: booking.reservationDetailID,
      reservationNo: booking.reservationNo,
      statusRaw: booking.statusRaw,
      reservationType: booking.reservationType,
      bookerFullName: booking.bookerFullName,
      refNo: booking.refNo,
      hotelID: booking.hotelID,
      hotelName: booking.hotelName,
      resCheckIn: booking.resCheckIn,
      resCheckOut: booking.resCheckOut,
      totalNights: booking.totalNights,
      totalRooms: booking.totalRooms,
      totalAmount: booking.totalAmount,
      currencyCode: booking.currencyCode,
      sourceOfBooking: booking.sourceOfBooking,
      createdOn: booking.createdOn,
      createdBy: booking.createdBy,
      lastUpdatedOn: booking.lastUpdatedOn,
      lastUpdatedBy: booking.lastUpdatedBy,
      isCancelled: booking.isCancelled,
      basis: booking.basis,
      extraBed: booking.extraBed,
      guest2: booking.guest2,
      guestProfileId: booking.guestProfileId,
      isRepeatGuest: booking.isRepeatGuest,
    };
    console.log("Processed Booking Object:", processedBooking);

    // Batch state updates to avoid multiple render cycles
    // First update the reservation state
    setSelectedReservation(processedBooking);

    // Use our safe drawer opener to prevent flickering
    setBookingDrawerOpenSafe(true);
  };

  // CSV Export Helper
  const exportBookingsToCSV = (bookingsToExport: any[], filename: string) => {
    const headers = [
      "Booking ID",
      "Guest",
      "Room Type",
      "Check-in",
      "Check-out",
      "Status",
      "Travel Agent",
      "Created On",
    ];

    const rows = bookingsToExport.map((b) => [
      b.reservationNo,
      b.guestName,
      b.roomType,
      b.checkIn ? format(new Date(b.checkIn), "yyyy-MM-dd HH:mm") : "",
      b.checkOut ? format(new Date(b.checkOut), "yyyy-MM-dd HH:mm") : "",
      b.status,
      b.sourceOfBooking || "N/A",
      b.createdOn ? format(new Date(b.createdOn), "yyyy-MM-dd HH:mm") : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------------------
  // 4d) Week Navigation
  // ----------------------------------------------------------------
  const handlePrevWeek = () => setStartDate((d) => addDays(d, -daysCount));
  const handleNextWeek = () => setStartDate((d) => addDays(d, daysCount));

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      userPickedDateRef.current = true; // user took control
      setStartDate(startOfDay(newDate)); // left-align grid from picked date
    }
  };

  useEffect(() => {
    if (didInitFromSystemDate.current) return; // already initialized
    if (userPickedDateRef.current) return; // user already chose a date
    if (!systemDate) return; // wait for systemDate

    const sys = startOfDay(new Date(systemDate));
    const startFromSystem = addDays(sys, -5); // 5 days before system date

    setDaysCount(15); // ensure 15-day window so sys is in the middle
    setStartDate(startFromSystem); // window = [sys-5 ... sys+9]

    didInitFromSystemDate.current = true;
  }, [systemDate]);

  // ----------------------------------------------------------------
  // 4e) Rendering Bookings for Card/List Views (with time information)
  // ----------------------------------------------------------------
  const renderBookingCard = (booking: any) => {
    return (
      <div className="w-full sm:w-1/2 lg:w-1/3 p-2" key={booking.reservationID}>
        <Card
          className="rounded-xl border border-gray-200 bg-white dark:bg-black text-black dark:text-white shadow-sm hover:shadow-md transition"
          onClick={() => handleReservationClick(booking)}
        >
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex justify-between items-start flex-wrap gap-y-2">
              <CardTitle className="text-base font-semibold">
                {booking.guestName}
              </CardTitle>
              <Badge
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: booking.statusColor || "#4CAF50",
                  color: "#fff",
                }}
              >
                {booking.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
              <span>
                {booking.checkIn && !isNaN(new Date(booking.checkIn).getTime())
                  ? format(new Date(booking.checkIn), "MMM d, yyyy")
                  : "--"}
              </span>

              <span className="text-gray-300">|</span>
              <span>
                {booking.checkOut &&
                !isNaN(new Date(booking.checkOut).getTime())
                  ? format(new Date(booking.checkOut), "MMM d, yyyy")
                  : "--"}
              </span>

              <span className="text-gray-300">|</span>
              <span>Room {booking.roomNumber || "--"} </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-muted-foreground space-y-1.5 border-t pt-3">
            <div>
              <span className="text-dark font-medium">Booking No:</span>{" "}
              {booking.reservationNo}
            </div>
            <div>
              <span className="text-dark font-medium">Stay:</span>{" "}
              {booking.checkIn && !isNaN(new Date(booking.checkIn).getTime())
                ? format(new Date(booking.checkIn), "MMM dd")
                : "--"}{" "}
              →{" "}
              {booking.checkOut && !isNaN(new Date(booking.checkOut).getTime())
                ? format(new Date(booking.checkOut), "MMM dd")
                : "--"}
            </div>

            <div>
              <span className="text-dark font-medium">Travel Agent:</span>{" "}
              {booking.sourceOfBooking || "N/A"}
            </div>
            <div>
              <span className="text-dark font-medium">Created On:</span>{" "}
              {safeFormatDate(booking.createdOn, "yyyy-MM-dd HH:mm")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Table-based booking list rendering function
  // Only renders once per viewType and tab (not per booking)
  const renderBookingList = (bookings: any[]) => {
    return (
      <div className="overflow-x-auto w-full">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-3 py-2 text-sm">Booking ID</th>
              <th className="px-3 py-2 text-sm">Guest</th>
              <th className="px-3 py-2 text-sm">Room Type</th>
              <th className="px-3 py-2 text-sm">Stay</th>
              <th className="px-3 py-2 text-sm">Status</th>
              <th className="px-3 py-2 text-sm">Travel Agent</th>
              <th className="px-3 py-2 text-sm">Created On</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking: any) => (
              <tr
                key={booking.reservationNo}
                onClick={() => handleReservationClick(booking)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-3 py-2">{booking.reservationNo}</td>
                <td className="px-3 py-2">{booking.guestName}</td>
                <td className="px-3 py-2">{booking.roomType}</td>
                <td className="px-3 py-2">
                  {booking.checkIn &&
                  !isNaN(new Date(booking.checkIn).getTime())
                    ? format(new Date(booking.checkIn), "MMM dd")
                    : "--"}{" "}
                  →{" "}
                  {booking.checkOut &&
                  !isNaN(new Date(booking.checkOut).getTime())
                    ? format(new Date(booking.checkOut), "MMM dd")
                    : "--"}
                </td>
                <td className="px-3 py-2">
                  <Badge
                    style={{
                      backgroundColor: booking.statusColor || "#ccc",
                      color: "#fff",
                    }}
                  >
                    {booking.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {booking.sourceOfBooking || "N/A"}
                </td>
                <td className="px-3 py-2">
                  {booking.createdOn &&
                  !isNaN(new Date(booking.createdOn).getTime())
                    ? format(new Date(booking.createdOn), "yyyy-MM-dd HH:mm")
                    : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ----------------------------------------------------------------
  // 4f) Filtering to Exclude Bookings Outside the Date Range for Timeline
  // ----------------------------------------------------------------
  const sameDayBookings = timelineBookings.filter((b) =>
    isSameDay(b.checkIn, b.checkOut || b.checkIn)
  );
  const nonSameDayBookings = timelineBookings.filter(
    (b) => !isSameDay(b.checkIn, b.checkOut || b.checkIn)
  );

  // ----------------------------------------------------------------
  // 4g) Overlay Positioning Helpers for Multi-day Bookings
  // ----------------------------------------------------------------
  // Reservation spans from the midpoint of check-in date to the midpoint of check-out date
  function computeBookingPosition(booking: any) {
    // Use the midpoint of check-in to midpoint of check-out
    const checkInDate = startOfDay(booking.checkIn).getTime();
    const checkOutDate = booking.checkOut
      ? startOfDay(booking.checkOut).getTime()
      : checkInDate;

    const checkInIndex = dates.findIndex(
      (d) => startOfDay(d).getTime() === checkInDate
    );
    const checkOutIndex = dates.findIndex(
      (d) => startOfDay(d).getTime() === checkOutDate
    );

    const startIndex = checkInIndex === -1 ? 0 : checkInIndex;
    const endIndex = checkOutIndex === -1 ? dates.length - 1 : checkOutIndex;

    const spanLength = endIndex - startIndex + 1;

    if (
      checkOutDate < dates[0].getTime() ||
      checkInDate > dates[dates.length - 1].getTime()
    ) {
      return null;
    }

    const flatRooms = roomTypes.flatMap((type) => type.rooms);
    const room = flatRooms.find((r) => r.id === booking.roomId);
    if (!room) return null;
    const roomType = roomTypes.find((t) =>
      t.rooms.some((r: { id: string }) => r.id === room.id)
    );
    const typeIndex = roomTypes.findIndex((t) => t.id === roomType?.id);
    const typeOffset = roomTypes
      .slice(0, typeIndex)
      .reduce((acc, curr) => acc + 1 + curr.rooms.length, 0);

    const roomIndexInType =
      roomType?.rooms.findIndex((r: { id: string }) => r.id === room.id) || 0;
    const rowIndex = typeOffset + roomIndexInType + 3;

    // Position: left starts at the center of the check-in date column
    const left = fixedColWidth + startIndex * dayColWidth + dayColWidth / 2;
    // Width: spanLength days (each from midpoint to midpoint)
    const width = spanLength * dayColWidth;

    return {
      left,
      width,
      top:
        headerHeight +
        (rowIndex - 2) * rowHeight +
        (rowHeight - bookingBlockHeight) / 2,
    };
  }
  console.log("sameDayBookings", sameDayBookings);
  // ----------------------------------------------------------------
  // 4h) Overlay Positioning Helpers for Same-day Bookings
  // ----------------------------------------------------------------
  function computeCellBasePosition(booking: any) {
    const bookingStart = startOfDay(booking.checkIn);
    const periodStart = startOfDay(startDate);
    const startDayIndex = differenceInCalendarDays(bookingStart, periodStart);

    const flatRooms = roomTypes.flatMap((type) => type.rooms);
    const room = flatRooms.find((r) => r.id === booking.roomId);
    if (!room) return null;
    const roomType = roomTypes.find((t) =>
      t.rooms.some((r: { id: string }) => r.id === room.id)
    );
    const typeIndex = roomTypes.findIndex((t) => t.id === roomType?.id);
    const typeOffset = roomTypes
      .slice(0, typeIndex)
      .reduce((acc, curr) => acc + 1 + curr.rooms.length, 0);

    const roomIndexInType =
      roomType?.rooms.findIndex((r: { id: string }) => r.id === room.id) || 0;
    const rowIndex = typeOffset + roomIndexInType + 3;

    const top =
      headerHeight +
      (rowIndex - 2) * rowHeight +
      (rowHeight - bookingBlockHeight) / 2;

    const allocatedWidth = 0.5 * dayColWidth;

    return { startDayIndex, top, allocatedWidth };
  }

  // Update viewType based on activeTab
  useEffect(() => {
    if (["arrival", "departure", "in-house"].includes(activeTab)) {
      setViewType("card");
    } else if (activeTab === "all") {
      setViewType("list");
    }
  }, [activeTab]);

  const departureBookingsMemo = useMemo(
    () =>
      bookings.filter((b) => {
        const status = normStatus(b.status ?? b.reservationStatus);
        const co = getCO(b);
        const isToday = dayEq(co, systemHotelDay);
        const excluded = ["cancelled", "no-show"].includes(status);
        return isToday && !excluded;
      }),
    [bookings, systemHotelDay]
  );

  const inHouseBookingsMemo = useMemo(
    () =>
      bookings.filter((b) => {
        const status = normStatus(b.status ?? b.reservationStatus);
        if (status !== "checked-in") return false;
        const ci = getCI(b),
          co = getCO(b);
        if (!ci || !co) return false;
        return dayLe(ci, systemHotelDay) && dayGt(co, systemHotelDay);
      }),
    [bookings, systemHotelDay]
  );

  // SignalR: Setup and teardown connection for real-time updates
  // useEffect(() => {
  //   startSignalRConnection(() => {
  //     console.log("📡 Reservation update received via SignalR");
  //     // Refresh bookings and availability
  //     fetchReservations();
  //     fetchAvailability();
  //   });

  //   return () => {
  //     stopSignalRConnection();
  //   };
  // }, []);

  const [guestProfileForCheckIn, setGuestProfileForCheckIn] =
    useState<any>(null);

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-0 flex-col gap-2 mt-0 pt-0 overflow-hidden">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold"></h1>
        </div>

        {/* Date Range Header, Calendar Picker & Navigation Arrows */}

        {/* Tabs for Additional Statuses */}
        <Tabs
          defaultValue="front-desk"
          className="mt-0 pt-0"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val)}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <TabsList className="flex gap-1">
                  <TabsTrigger value="front-desk">Front Desk</TabsTrigger>
                  <TabsTrigger value="arrival">Arrival</TabsTrigger>
                  <TabsTrigger value="departure">Departure</TabsTrigger>
                  <TabsTrigger value="in-house">In House</TabsTrigger>
                  {/* <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="tentative">Tentative</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger> */}
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex gap-2">
                {/* <Button onClick={() => setWalkInDrawerOpen(true)}>
                <UserPlus className="mr-0 h-4 w-4" />
                {walkIn}
              </Button> */}
                <div className="pr-4">
                  <VideoButton
                    onClick={() => setShowRawOverlay(true)}
                    label="Watch Video"
                  />
                </div>
                <Button onClick={() => setReservationDrawerOpen(true)}>
                  <Plus className="mr-0 h-4 w-4" />
                  {newReservationText}
                </Button>
                <Button onClick={() => setQuickReservationDrawerOpen(true)}>
                  <Plus className="mr-0 h-4 w-4" />
                  Reservation
                </Button>
                <Button onClick={() => setBusinessDrawerOpen(true)}>
                  Business Block
                </Button>
              </div>
            </div>
          </div>
          <TabsContent
            value="front-desk"
            className="flex-1 min-h-0 overflow-hidden"
          >
            <Card className="mt-0 h-[calc(100vh-180px)]">
              <CardContent className="p-0 h-full flex flex-col min-h-0 overflow-hidden">
                {/* non-scrolling header inside the card */}
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-300/40">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevWeek}
                      className="rounded-md border border-gray-300 shadow-sm w-7 h-7"
                    >
                      <ChevronLeftCircle className="h-4 w-4" />
                    </Button>

                    {dates.length > 0 ? (
                      <div className="text-sm font-semibold border border-gray-300 rounded-md shadow-sm px-3 py-1.5">
                        {format(dates[0], "dd MMM yyyy")} –{" "}
                        {format(dates[dates.length - 1], "dd MMM yyyy")}
                      </div>
                    ) : (
                      <div className="text-sm font-semibold">
                        Loading date range...
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextWeek}
                      className="rounded-md border border-gray-300 shadow-sm w-7 h-7"
                    >
                      <ChevronRightCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 pr-4">
                    <span className="text-sm font-semibold">Grid Days:</span>
                    <Select
                      value={daysCount?.toString()}
                      onValueChange={(value) => setDaysCount(Number(value))}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-sm px-3 border border-gray-300 rounded-md shadow-sm [&>svg]:hidden">
                        {daysCount ? `${daysCount} Days` : "Loading..."}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Days</SelectItem>
                        <SelectItem value="5">5 Days</SelectItem>
                      </SelectContent>
                    </Select>

                    <input
                      type="date"
                      value={format(startDate, "yyyy-MM-dd")}
                      onChange={handleDateChange}
                      className="border border-gray-300 rounded-md shadow-sm px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-auto">
                  <GridLayout
                    ref={gridRef}
                    dates={dates}
                    roomTypes={roomTypes}
                    rowHeight={rowHeight}
                    bookingBlockHeight={bookingBlockHeight}
                    fixedColWidth={fixedColWidth}
                    dayColWidth={dayColWidth || 80}
                    nonSameDayBookings={nonSameDayBookings}
                    sameDayBookings={sameDayBookings}
                    handleReservationClick={handleReservationClick}
                    computeBookingPosition={computeBookingPosition}
                    computeCellBasePosition={computeCellBasePosition}
                    statusColors={bookings.reduce((acc, b) => {
                      acc[b.id] = b.statusColor;
                      return acc;
                    }, {} as Record<string, string>)}
                    roomAvailability={roomAvailability}
                    onSelectRange={handleSelectRange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <div className="flex flex-col gap-0 py-2 px-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">All Reservations</h2>
                <div className="flex gap-2">
                  <Button
                    variant={viewType === "card" ? "default" : "outline"}
                    onClick={() => setViewType("card")}
                    size="icon"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewType === "list" ? "default" : "outline"}
                    onClick={() => setViewType("list")}
                    size="icon"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      exportBookingsToCSV(
                        allBookings.filter(
                          (b) => b.checkIn >= startDate && b.checkIn <= endDate
                        ),
                        "all_reservations"
                      )
                    }
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                View all reservations across statuses
              </p>
            </div>
            <AllReservationsTab
              bookings={allBookings.filter(
                (b) => b.checkIn >= startDate && b.checkIn <= endDate
              )}
              viewType={viewType}
              renderBookingCard={(booking: any) => renderBookingCard(booking)}
              renderBookingListItem={() =>
                renderBookingList(
                  allBookings.filter(
                    (b) => b.checkIn >= startDate && b.checkIn <= endDate
                  )
                )
              }
              label="All Reservations"
              description="View all reservations"
              CardContainer={({ children }: { children: React.ReactNode }) => (
                <div className="flex flex-wrap -m-2">{children}</div>
              )}
              searchInput={
                <div className="flex justify-between items-center mt-2">
                  <input
                    type="text"
                    placeholder="Search guest or booking ID..."
                    className="w-full max-w-xs border px-3 py-1.5 rounded-md shadow-sm text-sm"
                  />
                </div>
              }
            />
          </TabsContent>
          <TabsContent value="confirmed">
            <div className="flex flex-col gap-0 py-2 px-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  Confirmed Reservations
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant={viewType === "card" ? "default" : "outline"}
                    onClick={() => setViewType("card")}
                    size="icon"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewType === "list" ? "default" : "outline"}
                    onClick={() => setViewType("list")}
                    size="icon"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Confirmed bookings currently registered
              </p>
            </div>
            <ConfirmedTab
              bookings={confirmedBookings.filter(
                (b) => b.checkIn >= startDate && b.checkIn <= endDate
              )}
              viewType={viewType}
              renderBookingCard={(booking: any) => renderBookingCard(booking)}
              renderBookingListItem={() =>
                renderBookingList(
                  confirmedBookings.filter(
                    (b) => b.checkIn >= startDate && b.checkIn <= endDate
                  )
                )
              }
              label="Confirmed"
              description="Confirmed reservations"
              CardContainer={({ children }: { children: React.ReactNode }) => (
                <div className="flex flex-wrap -m-2">{children}</div>
              )}
            />
          </TabsContent>
          <TabsContent value="tentative">
            <div className="flex flex-col gap-0 py-2 px-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  Tentative Reservations
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant={viewType === "card" ? "default" : "outline"}
                    onClick={() => setViewType("card")}
                    size="icon"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewType === "list" ? "default" : "outline"}
                    onClick={() => setViewType("list")}
                    size="icon"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Tentative bookings awaiting confirmation
              </p>
            </div>
            <TentativeTab
              bookings={tentativeBookings.filter(
                (b) => b.checkIn >= startDate && b.checkIn <= endDate
              )}
              viewType={viewType}
              renderBookingCard={(booking: any) => renderBookingCard(booking)}
              renderBookingListItem={() =>
                renderBookingList(
                  tentativeBookings.filter(
                    (b) => b.checkIn >= startDate && b.checkIn <= endDate
                  )
                )
              }
              label="Tentative"
              description="Tentative reservations"
              CardContainer={({ children }: { children: React.ReactNode }) => (
                <div className="flex flex-wrap -m-2">{children}</div>
              )}
            />
          </TabsContent>
          <TabsContent value="arrival">
            <div className="flex flex-col gap-0 py-2 px-4 bg">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Arrivals</h2>
                <div className="flex gap-2">
                  <Button
                    variant={viewType === "card" ? "default" : "outline"}
                    onClick={() => setViewType("card")}
                    size="icon"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewType === "list" ? "default" : "outline"}
                    onClick={() => setViewType("list")}
                    size="icon"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      exportBookingsToCSV(arrivalBookings, "arrivals")
                    }
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Guests scheduled to arrive today
              </p>
            </div>

            <ArrivalsTab
              bookings={arrivalBookings}
              viewType={viewType}
              renderBookingCard={renderBookingCard}
              renderBookingListItem={() => renderBookingList(arrivalBookings)}
              label="Arrival"
              description="Guests arriving today"
              CardContainer={({ children }) => (
                <div className="flex flex-wrap -m-2">{children}</div>
              )}
            />
          </TabsContent>
          <TabsContent value="departure">
            {(() => {
              // const departureBookings = useMemo(
              //   () =>
              //     bookings.filter((b) => {
              //       const status = normStatus(b.status ?? b.reservationStatus);
              //       const co = getCO(b);
              //       const isToday = dayEq(co, systemHotelDay);
              //       const excluded = ["cancelled", "no-show"].includes(status);
              //       return isToday && !excluded;
              //     }),
              //   [bookings, systemHotelDay]
              // );

              return (
                <>
                  <div className="flex flex-col gap-0 py-2 px-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">Departures</h2>
                      <div className="flex gap-2">
                        <Button
                          variant={viewType === "card" ? "default" : "outline"}
                          onClick={() => setViewType("card")}
                          size="icon"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewType === "list" ? "default" : "outline"}
                          onClick={() => setViewType("list")}
                          size="icon"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            exportBookingsToCSV(departureBookings, "departures")
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Guests scheduled to depart today
                    </p>
                  </div>
                  <DeparturesTab
                    bookings={departureBookingsMemo}
                    viewType={viewType}
                    renderBookingCard={renderBookingCard}
                    renderBookingListItem={() =>
                      renderBookingList(departureBookings)
                    }
                    label="Departure"
                    description="Guests departing today"
                    CardContainer={({ children }) => (
                      <div className="flex flex-wrap -m-2">{children}</div>
                    )}
                  />
                </>
              );
            })()}
          </TabsContent>
          <TabsContent value="in-house">
            {(() => {
              // const inHouseBookings = useMemo(
              //   () =>
              //     bookings.filter((b) => {
              //       const status = normStatus(b.status ?? b.reservationStatus);
              //       if (status !== "checked-in") return false; // hard gate
              //       const ci = getCI(b),
              //         co = getCO(b);
              //       if (!ci || !co) return false;
              //       return (
              //         dayLe(ci, systemHotelDay) && dayGt(co, systemHotelDay)
              //       );
              //     }),
              //   [bookings, systemHotelDay]
              // );

              return (
                <>
                  <div className="flex flex-col gap-0 py-2 px-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">In-House Guests</h2>
                      <div className="flex gap-2">
                        <Button
                          variant={viewType === "card" ? "default" : "outline"}
                          onClick={() => setViewType("card")}
                          size="icon"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewType === "list" ? "default" : "outline"}
                          onClick={() => setViewType("list")}
                          size="icon"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            exportBookingsToCSV(inHouseBookings, "in_house")
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Guests currently checked into the hotel
                    </p>
                  </div>
                  <InHouseTab
                    bookings={inHouseBookingsMemo}
                    viewType={viewType}
                    renderBookingCard={(b: any) => renderBookingCard(b)}
                    renderBookingListItem={() =>
                      renderBookingList(inHouseBookings)
                    }
                    label="In House"
                    description="Currently in-house guests"
                    CardContainer={({
                      children,
                    }: {
                      children: React.ReactNode;
                    }) => <div className="flex flex-wrap -m-2">{children}</div>}
                  />
                </>
              );
            })()}
          </TabsContent>
          <TabsContent value="other">
            <div className="flex flex-col gap-0 py-2 px-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Other Reservations</h2>
                <div className="flex gap-2">
                  <Button
                    variant={viewType === "card" ? "default" : "outline"}
                    onClick={() => setViewType("card")}
                    size="icon"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewType === "list" ? "default" : "outline"}
                    onClick={() => setViewType("list")}
                    size="icon"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Reservations marked as cancelled, no-show, or other special
                statuses
              </p>
            </div>
            <OtherTab
              bookings={bookings.filter(
                (b) =>
                  [
                    "no-show",
                    "block",
                    "no-show-without-charge",
                    "cancelled",
                    "checked-in",
                    "checked-out",
                  ].includes(b.status) &&
                  b.checkIn >= startDate &&
                  b.checkIn <= endDate
              )}
              viewType={viewType}
              renderBookingCard={(booking: any) => renderBookingCard(booking)}
              renderBookingListItem={() =>
                renderBookingList(
                  bookings.filter(
                    (b) =>
                      [
                        "no-show",
                        "block",
                        "no-show-without-charge",
                        "cancelled",
                        "checked-in",
                        "checked-out",
                      ].includes(b.status) &&
                      b.checkIn >= startDate &&
                      b.checkIn <= endDate
                  )
                )
              }
              label="Other"
              description="Other reservation statuses"
              CardContainer={({ children }: { children: React.ReactNode }) => (
                <div className="flex flex-wrap -m-2">{children}</div>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Drawers */}
        <WalkInDrawer
          open={walkInDrawerOpen}
          onOpenChange={setWalkInDrawerOpen}
          setGuestProfileForCheckIn={setGuestProfileForCheckIn}
        />
        <ReservationDrawer
          open={reservationDrawerOpen}
          onOpenChange={setReservationDrawerOpen}
        />
        <BookingDetailsDrawer
          open={bookingDrawerOpen}
          isBookingPageView={false}
          onOpenChange={setBookingDrawerOpen}
          bookingDetail={selectedReservation}
          text={{
            bookingDetailsText: "Booking ",
            roomDetailsText: "Room Details",
            roomText: "Room",
            totalText: "Total",
            customerDetailsText: "Customer Details",
            nameText: "Name",
            phoneText: "Phone",
            emailText: "Email",
            idTypeText: "ID Type",
            idNumberText: "ID Number",
            notesText: "Notes",
            addNoteText: "Add note...",
            expensesText: "Expenses",
            revisionsText: "Revisions",
            messageGuestText: "Message Guest",
          }}
          onCancelBookingClick={() => {
            setCancelModalOpen(true);
            setBookingDrawerOpenSafe(false);
          }}
          guestProfileData={guestProfileForCheckIn}
          countryListFromWalkIn={guestProfileForCheckIn?.countryList}
        />
        <QuickReservationDrawer
          open={quickReservationDrawerOpen}
          onOpenChange={setQuickReservationDrawerOpen}
          // onClick={() => setQuickReservationDrawerOpen(false)}
          initialRange={quickPrefill ?? undefined}
        />
        <BusinessBlockDrawer
          open={businessDrawerOpen}
          onOpenChange={setBusinessDrawerOpen}
          // onClick={() => setBusinessDrawerOpen(false)}
        />

        <CreateRoomTypeModal
          open={createRoomTypeModalOpen}
          onOpenChange={setCreateRoomTypeModalOpen}
        />
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />
      </div>
      {/* pinned version label */}
      <div className="fixed bottom-2 right-3 text-xs text-muted-foreground select-none">
        V.09.01.16.18
      </div>
    </DashboardLayout>
  );
}
