"use client";

import React, { forwardRef, JSX, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { useClientStorage } from "@/hooks/useClientStorage";
import { api } from "@/lib/api";
import Image from "next/image";
import BookingLogo from "../../../assets/icons/Booking.comLogo.png";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  updateHousekeepingStatus,
  type UpdateHousekeepingPayload,
} from "@/redux/slices/housekeepingStatusSlice";

// replace with:
import { differenceInCalendarDays } from "date-fns";

import {
  CalendarRange,
  BedSingle,
  BriefcaseBusiness,
  Zap,
  Wrench,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Models ---
interface Room {
  id: string;
  number: string;
  rate: number;
  housekeepingStatus?: "Clean" | "Occupied" | "Dirty" | "WIP" | string;
}
interface RoomType {
  id: string;
  name: string;
  rooms: Room[];
}
interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guests: number;
  checkIn: Date;
  checkOut?: Date;
  status: string;
  statusColor?: string;
  agentLogoURL?: string; // ⬅️ already used in your render
  reservationNo?: string; // optional
  source?: string;
  reservationType?: string;
}

// --- Props ---
interface GridLayoutProps {
  dates: Date[];
  roomTypes: RoomType[];
  rowHeight: number;
  bookingBlockHeight: number;
  fixedColWidth: number;
  dayColWidth: number;
  nonSameDayBookings: Booking[];
  sameDayBookings: Booking[];
  handleReservationClick: (b: Booking) => void;
  statusColors: Record<string, string>;
  computeBookingPosition: (
    b: Booking
  ) => { left: number; width: number; top: number } | null;
  computeCellBasePosition: (
    b: Booking
  ) => { startDayIndex: number; top: number; allocatedWidth: number } | null;
  roomAvailability: {
    roomTypeId: number;
    availability: { date: string; count: number }[];
  }[];
  onQuickSelectRange?: (payload: {
    roomId: string;
    roomNumber: string;
    roomTypeId: string;
    roomTypeName: string;
    startDate: Date;
    endDate: Date;
  }) => void;
  onBusinessSelectRange?: (payload: {
    roomId: string;
    roomNumber: string;
    roomTypeId: string;
    roomTypeName: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

type DragSel = {
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  startIdx: number; // column index where drag started
  endIdx: number; // column index where drag currently is
} | null;

// --- Component ---
const GridLayout = forwardRef<HTMLDivElement, GridLayoutProps>(
  (
    {
      dates,
      roomTypes,
      rowHeight,
      bookingBlockHeight,
      fixedColWidth,
      dayColWidth,
      nonSameDayBookings,
      sameDayBookings,
      handleReservationClick,
      statusColors,
      computeBookingPosition: _computeBookingPosition,
      computeCellBasePosition,
      roomAvailability,
      onQuickSelectRange,
      onBusinessSelectRange,
    },
    ref
  ) => {
    // Responsive day column width logic
    console.log("roomAvailability aaaa : ", roomAvailability);

    console.log("test booking : ", statusColors);
    console.log("test boking block : ", nonSameDayBookings);

    const containerRef = useRef<HTMLDivElement>(null);
    const [responsiveDayColWidth, setResponsiveDayColWidth] =
      useState(dayColWidth);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
      null
    );
    const [hoveredRowTop, setHoveredRowTop] = useState<number | null>(null);
    const [hoveredColLeft, setHoveredColLeft] = useState<number | null>(null);
    const { hotelId, accessToken } = useClientStorage();
    const [hoveredRoom, setHoveredRoom] = useState<{
      id: string;
      top: number;
      height: number;
    } | null>(null);
    type SelectPayload = {
      roomId: string;
      roomNumber: string;
      roomTypeId: string;
      roomTypeName: string;
      startDate: Date; // check-in (inclusive)
      endDate: Date; // check-out (exclusive)
    };

    const [finalSel, setFinalSel] = useState<{
      roomId: string;
      roomNumber: string;
      roomTypeId: string;
      roomTypeName: string;
      startIdx: number;
      endIdx: number;
    } | null>(null);

    const [selectionMenu, setSelectionMenu] = useState<{
      x: number;
      y: number;
      placement: "top" | "bottom";
      payload: SelectPayload;
    } | null>(null);

    const [dragSel, setDragSel] = useState<DragSel>(null);
    // add near other refs
    const rowBoxMap = useRef<Record<string, { top: number; height: number }>>(
      {}
    );

    console.log("hotel id :", hotelId);
    console.log("accessToken :", accessToken);
    console.log("room type list :", roomTypes);

    const dispatch = useDispatch();
    const systemDate = useAppSelector(
      (state: RootState) => state.systemDate.value
    );

    // For each room, which day indices are occupied?
    const occupiedByRoom: Record<string, Set<number>> = {};
    roomTypes.forEach((t) =>
      t.rooms.forEach((r) => (occupiedByRoom[r.id] = new Set()))
    );

    useEffect(() => {
      dispatch(fetchSystemDate());
    }, [dispatch]);

    const commitDrag = useCallback(() => {
      if (!dragSel) return;

      const start = Math.min(dragSel.startIdx, dragSel.endIdx);
      const endInclusive = Math.max(dragSel.startIdx, dragSel.endIdx);

      // reject if any cell in the span is occupied
      const occ = occupiedByRoom[dragSel.roomId] || new Set<number>();
      for (let i = start; i <= endInclusive; i++) {
        if (occ.has(i)) {
          setDragSel(null);
          setFinalSel(null);
          return;
        }
      }

      // [check-in, check-out)
      const endExclusive = Math.min(endInclusive + 1, dates.length);
      const startDate = dates[start];
      const endDate =
        endExclusive < dates.length
          ? dates[endExclusive]
          : new Date(dates[dates.length - 1].getTime() + 24 * 60 * 60 * 1000);

      // base X (center of the range)
      const left = fixedColWidth + start * responsiveDayColWidth;
      const width = Math.max(
        0,
        (endInclusive - start + 1) * responsiveDayColWidth
      );
      const x = left + width / 2;

      // vertical measurements
      const box = rowBoxMap.current[dragSel.roomId];
      const selTop = box?.top ?? rowTopMap.current[dragSel.roomId] ?? 0;
      const selBottom = selTop + (box?.height ?? rowHeight);

      // decide placement relative to the visible viewport
      const container = containerRef.current!;
      const viewTop = container.scrollTop;
      const viewBottom = viewTop + container.clientHeight;
      const selMid = (selTop + selBottom) / 2;

      // if selection's middle is in the top half of viewport -> place menu below; else above
      const placement: "top" | "bottom" =
        selMid - viewTop < container.clientHeight / 2 ? "bottom" : "top";

      // anchor y just outside the selection box
      const OFFSET = 8;
      const y = placement === "bottom" ? selBottom + OFFSET : selTop - OFFSET;

      // keep the highlight persisted
      setFinalSel({
        roomId: dragSel.roomId,
        roomNumber: dragSel.roomNumber,
        roomTypeId: dragSel.roomTypeId,
        roomTypeName: dragSel.roomTypeName,
        startIdx: start,
        endIdx: endInclusive,
      });

      setSelectionMenu({
        x,
        y,
        placement,
        payload: {
          roomId: dragSel.roomId,
          roomNumber: dragSel.roomNumber,
          roomTypeId: dragSel.roomTypeId,
          roomTypeName: dragSel.roomTypeName,
          startDate,
          endDate,
        },
      });

      setDragSel(null);
    }, [
      dragSel,
      dates,
      fixedColWidth,
      occupiedByRoom,
      responsiveDayColWidth,
      rowHeight,
    ]);

    useEffect(() => {
      const up = () => commitDrag();
      const esc = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setDragSel(null);
          setFinalSel(null);
          setSelectionMenu(null);
        }
      };

      // optional: click outside the menu to clear
      const onDocClick = (e: MouseEvent) => {
        // if a menu is open and the click is not on it, clear
        if (selectionMenu) {
          const target = e.target as HTMLElement;
          // if your menu has a wrapping class or role, you can refine this check
          if (!target.closest(".selection-menu-popover")) {
            setSelectionMenu(null);
            setFinalSel(null);
          }
        }
      };

      window.addEventListener("mouseup", up);
      window.addEventListener("keydown", esc);
      document.addEventListener("mousedown", onDocClick);

      return () => {
        window.removeEventListener("mouseup", up);
        window.removeEventListener("keydown", esc);
        document.removeEventListener("mousedown", onDocClick);
      };
    }, [commitDrag, selectionMenu]);

    const didInitialCenter = useRef(false);

    function centerOnColumn(index: number) {
      const scrollEl = scrollableBodyRef.current || containerRef.current;
      if (!scrollEl) return;

      // visible width excluding the fixed room column
      const viewport = scrollEl.clientWidth - Math.max(0, fixedColWidth);

      // pixel where the target column starts
      const colLeft = fixedColWidth + index * responsiveDayColWidth;

      // we want the column centered in the scrollable viewport
      const targetScrollLeft = Math.max(
        0,
        colLeft - (viewport - responsiveDayColWidth) / 2
      );

      scrollEl.scrollLeft = targetScrollLeft;
    }

    useEffect(() => {
      if (didInitialCenter.current) return;
      if (!systemDate || !dates?.length || !responsiveDayColWidth) return;

      const sys = startOfDay(new Date(systemDate)).getTime();
      const idx = dates.findIndex((d) => startOfDay(d).getTime() === sys);
      if (idx !== -1) {
        // wait a frame to ensure widths are measured
        requestAnimationFrame(() => {
          centerOnColumn(idx);
          didInitialCenter.current = true;
        });
      }
      // run when dates/width/systemDate become ready
    }, [dates, responsiveDayColWidth, systemDate, fixedColWidth]);

    function getRoomTypeInfo(roomId: string) {
      for (const rt of roomTypes) {
        const match = rt.rooms.find((r) => r.id === roomId);
        if (match) return { roomTypeId: String(rt.id), roomTypeName: rt.name };
      }
      return { roomTypeId: "", roomTypeName: "" };
    }

    /** After the user changes the date range (dates array changes),
     *  align to the left edge (start date) instead of re-centering. */
    useEffect(() => {
      if (!didInitialCenter.current) return; // skip the very first render
      const scrollEl = scrollableBodyRef.current || containerRef.current;
      if (!scrollEl) return;
      // snap to the start of the grid (left-aligned)
      scrollEl.scrollLeft = 0;
    }, [dates]);

    console.log("System Date in Quick Reservation Drawer:", systemDate);
    const overlayHostRef = useRef<HTMLDivElement>(null);
    const isToday = systemDate;

    const hkDotColor = (status?: string) => {
      const statusName = (status || "").trim();
      
      // Handle both display names and status codes
      switch (statusName) {
        case "Clean":
        case "Status 1":
          return "bg-green-500";
        case "Occupied":
        case "Status 6":
          return "bg-yellow-500";
        case "Dirty":
        case "Status 2":
        case "Status 7":
          return "bg-red-500";
        case "WIP":
        case "Status 5":
          return "bg-blue-500";
        case "Turn-down":
        case "Status 3":
          return "bg-blue-500";
        case "Inspection":
          return "bg-blue-500";
        default:
          return "bg-black";
      }
    };


    // Add this helper function near your other utility functions
    const getHKDisplayName = (status?: string): string => {
      const statusName = (status || "").trim();
      
      switch (statusName) {
        case "Clean":
        case "Status 1":
          return "Clean";
        case "Occupied":
        case "Status 6":
          return "Occupied";
        case "Dirty":
        case "Status 2":
        case "Status 7":
          return "Dirty";
        case "WIP":
        case "Status 5":
          return "WIP";
        case "Turn-down":
        case "Status 3":
          return "Turn-down";
        case "Inspection":
          return "Inspection";
        default:
          return "Default"; // Default fallback
      }
    };

    // Optimistic HK overrides so the dot updates immediately
    const [hkOverride, setHkOverride] = useState<Record<string, string>>({});
    const [hkUpdating, setHkUpdating] = useState<Record<string, boolean>>({});

    const handleHkChange = async (
      room: Room,
      next: "Clean" | "Dirty" | "Occupied" | "WIP"
    ) => {
      const roomKey = room.id.toString();
      const prev = hkOverride[roomKey] ?? room.housekeepingStatus ?? "Clean";

      // optimistic update
      setHkOverride((m) => ({ ...m, [roomKey]: next }));
      setHkUpdating((m) => ({ ...m, [roomKey]: true }));

      const payload: UpdateHousekeepingPayload = {
        id: Number(roomKey), // 🔁 If your API needs roomID instead, replace with that
        housekeepingStatus: next,
      };

      const action = await dispatch(updateHousekeepingStatus(payload));
      setHkUpdating((m) => ({ ...m, [roomKey]: false }));

      if (updateHousekeepingStatus.rejected.match(action)) {
        // revert on failure
        setHkOverride((m) => ({ ...m, [roomKey]: prev }));
        toast.error(
          (action as any)?.payload || `Failed to update room ${room.number}`
        );
      } else {
        toast.success(`Room ${room.number} marked ${next}`);
      }
    };

    function AgentBadge({
      name,
      logo,
      size = 20,
    }: {
      name: string;
      logo?: string | null;
      size?: number;
    }) {
      const [failed, setFailed] = useState(false);
      const showLogo = !!logo && !failed;

      if (showLogo) {
        return (
          <Image
            src={logo as string}
            alt={name || "agent"}
            width={size}
            height={size}
            onError={() => setFailed(true)}
            loading="lazy"
            className="rounded-full shrink-0"
          />
        );
      }

      const initial = (name || "?").trim().charAt(0).toUpperCase();
      return (
        <div
          className="rounded-full bg-orange-500 text-white grid place-items-center shrink-0"
          style={{
            width: size,
            height: size,
            fontSize: Math.max(10, size * 0.55),
          }}
          aria-label={name}
          title={name}
        >
          {initial}
        </div>
      );
    }

    const getBookingBgColor = (booking: Booking | any) => {
      // 1. Business Block override
      if (booking.reservationType === "BUSINESS_BLOCK") {
        if (statusLegend["Block"]) {
          return statusLegend["Block"]; // 👈 use Block color from legend
        }
      }

      // 2. Normal behavior
      return (
        booking.statusColor ||
        statusColors[booking.status] || // from props
        "#ccc"
      );
    };

    // Dynamically compute day column width based on container width and number of days
    useEffect(() => {
      const updateWidth = () => {
        requestAnimationFrame(() => {
          const el = scrollableBodyRef.current || containerRef.current;
          if (el) {
            const containerWidth =
              el.getBoundingClientRect().width - fixedColWidth;
            const newDayColWidth = containerWidth / dates.length;
            setResponsiveDayColWidth(newDayColWidth);
          }
        });
      };

      updateWidth();
      const resizeObserver = new ResizeObserver(updateWidth);
      const el = scrollableBodyRef.current || containerRef.current;
      if (el) {
        resizeObserver.observe(el);
      }

      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
        if (el) resizeObserver.unobserve(el);
      };
    }, [dates.length, fixedColWidth]);
    // Ensure all Room.id values are strings to match Booking.roomId
    roomTypes = roomTypes.map((type) => ({
      ...type,
      rooms: type.rooms.map((room) => ({
        ...room,
        id: room.id.toString(),
      })),
    }));

    // Map of roomId -> pixel offset of its table row (relative to the GridLayout container)
    const rowTopMap = useRef<Record<string, number>>({});

    const normalizeBookings = (raw: Booking[]): Booking[] =>
      raw.map((b) => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: b.checkOut ? new Date(b.checkOut) : undefined,
      }));

    // Combine and normalize all bookings (same-day and non-same-day)
    const allBookings = normalizeBookings([
      ...nonSameDayBookings,
      ...sameDayBookings,
    ]);

    type DragSel = {
      roomId: string;
      roomNumber: string;
      startIdx: number;
      endIdx: number;
    } | null;

    // helper: get day index within current grid
    const dayIndexOf = (d: Date) =>
      dates.findIndex(
        (x) => startOfDay(x).getTime() === startOfDay(d).getTime()
      );

    allBookings.forEach((b) => {
      const ci = startOfDay(new Date(b.checkIn));
      const co = b.checkOut
        ? startOfDay(new Date(b.checkOut))
        : startOfDay(new Date(b.checkIn));

      const ciIdx = dayIndexOf(ci);
      const coIdx = dayIndexOf(co);

      if (ci.getTime() === co.getTime()) {
        // same-day booking blocks that single day
        if (ciIdx >= 0) occupiedByRoom[b.roomId]?.add(ciIdx);
        return;
      }

      // multi-night occupies [ci, co) (check-out exclusive)
      const first = Math.max(0, ciIdx);
      const last = (coIdx >= 0 ? coIdx : dates.length) - 1;
      for (let i = first; i <= last && i < dates.length; i++) {
        if (i >= 0) occupiedByRoom[b.roomId]?.add(i);
      }
    });

    console.log("all bookings :", allBookings);

    // --- Pre‑compute bookings grouped by room (ALL bookings) ---
    const bookingsByRoom: Record<string, Booking[]> = {};
    allBookings.forEach((bk) => {
      (bookingsByRoom[bk.roomId] ||= []).push(bk);
    });
    Object.values(bookingsByRoom).forEach((arr) =>
      arr.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
    );

    // --- Assign each booking to the first free stack row that does NOT overlap ---
    const bookingRowMap: Record<string, number> = {}; // bookingId -> stack row index
    const rowsByRoom: Record<string, Booking[][]> = {}; // roomId -> rows of bookings

    // Overlap detection: treat same-day bookings as having a visual span for stacking
    const overlaps = (a: Booking, b: Booking) => {
      const aStart = new Date(a.checkIn).getTime();
      const aEnd = a.checkOut ? new Date(a.checkOut).getTime() : aStart;

      const bStart = new Date(b.checkIn).getTime();
      const bEnd = b.checkOut ? new Date(b.checkOut).getTime() : bStart;

      // bookings do NOT overlap if one ends *on or before* the other starts
      return !(aEnd <= bStart || bEnd <= aStart);
    };

    for (const [roomId, bkArray] of Object.entries(bookingsByRoom)) {
      const rows: Booking[][] = [];
      bkArray.forEach((bk) => {
        // try to place into the first row without overlap
        let placed = false;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].every((other) => !overlaps(bk, other))) {
            rows[i].push(bk);
            bookingRowMap[bk.id] = i;
            placed = true;
            break;
          }
        }
        // if no existing row fits, start a new one
        if (!placed) {
          rows.push([bk]);
          bookingRowMap[bk.id] = rows.length - 1;
        }
      });
      rowsByRoom[roomId] = rows;
    }

    // --- Compute the height required for each room based on the peak number of overlapping bookings ---
    const roomHeightMap: Record<string, number> = {};
    for (const [roomId, rows] of Object.entries(rowsByRoom)) {
      const peak = rows.length; // number of stack rows needed
      const requiredHeight = peak * bookingBlockHeight + (peak - 1) * 2; // 2px gap between stacked blocks
      roomHeightMap[roomId] = Math.max(rowHeight, requiredHeight);
    }

    const [statusLegend, setStatusLegend] = useState<Record<string, string>>(
      {}
    );

    console.log("statusLegend : ", statusLegend);

    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("all");

    const [hotelDate, setHotelDate] = useState<Date | null>(null);

    useEffect(() => {
      if (!accessToken || !hotelId) return;

      axios
        .get(`${BASE_URL}/api/Hotel/${hotelId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const hotelDateStr = response.data.hotelDate;
          if (hotelDateStr) {
            setHotelDate(new Date(hotelDateStr));
          }
        })
        .catch((error) => {
          console.error("Failed to fetch hotel date:", error);
        });
    }, []);

    useEffect(() => {
      if (!accessToken) return; // wait until token is available
      api
        .get("/Reservation/status-codes") // goes through /api/hotelmate/...
        .then((res) => {
          const legendMap: Record<string, string> = {};
          res.data.forEach((s: any) => {
            legendMap[s.reservationStatus] = s.reservationStatusColour;
          });
          setStatusLegend(legendMap);
        })
        .catch(console.error);
    }, [accessToken]);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const weekStartMs = dates[0].setHours(0, 0, 0, 0);
    const weekEndMs = dates[dates.length - 1].setHours(23, 59, 59, 999);
    const minX = fixedColWidth;
    const maxX = fixedColWidth + dates.length * responsiveDayColWidth;

    // Helper to compute the top position of a booking
    // Priority:
    //   1. Use the real DOM‑measured offset stored in rowTopMap (pixel‑perfect)
    //   2. Fallback to the previous manual calculation if the ref isn’t filled yet
    const computeBookingTop = (booking: Booking): number => {
      const domOffset = rowTopMap.current[booking.roomId];
      if (typeof domOffset === "number") {
        return domOffset;
      }

      // ---- Fallback (first render before refs resolve) ----
      const STATIC_HEADER_ROWS = 2; // "Rooms / Dates" + "Availability"
      let offset = STATIC_HEADER_ROWS * rowHeight;

      // Only count room‑types that are currently visible
      const visibleTypes = roomTypes.filter(
        (t) => selectedRoomTypeId === "all" || t.id === selectedRoomTypeId
      );

      for (const type of visibleTypes) {
        // Add the room‑type header row
        offset += rowHeight;

        for (const r of type.rooms) {
          if (r.id === booking.roomId) {
            return offset;
          }
          offset += roomHeightMap[r.id] ?? rowHeight;
        }
      }

      return offset; // shouldn’t normally be hit
    };

    // Responsive computeBookingPosition: same-day bookings span full column,
    // others start/end at midday of check-in/check-out days.
    const computeBookingPosition = (booking: Booking) => {
      const checkInTime = startOfDay(booking.checkIn).getTime();
      const checkOutTime = booking.checkOut
        ? startOfDay(booking.checkOut).getTime()
        : checkInTime;

      const gridStartTime = startOfDay(dates[0]).getTime();
      const gridEndTime = startOfDay(dates[dates.length - 1]).getTime();

      // Determine if the booking continues across boundaries
      const continuesFromPrev = checkInTime < gridStartTime;
      const continuesToNext = checkOutTime > gridEndTime;

      const clampedStart = continuesFromPrev ? gridStartTime : checkInTime;
      const clampedEnd = continuesToNext ? gridEndTime : checkOutTime;

      const startIndex = dates.findIndex(
        (d) => startOfDay(d).getTime() === clampedStart
      );
      const endIndex = dates.findIndex(
        (d) => startOfDay(d).getTime() === clampedEnd
      );

      const finalStart = startIndex !== -1 ? startIndex : 0;
      const finalEnd = endIndex !== -1 ? endIndex : dates.length - 1;

      const sameDay = clampedStart === clampedEnd;
      const horizontalGap = 2; // or any value in pixels you prefer

      // Modified left calculation per instructions:
      const left =
        sameDay || continuesFromPrev
          ? fixedColWidth + finalStart * responsiveDayColWidth
          : fixedColWidth + (finalStart + 0.5) * responsiveDayColWidth;
      const right =
        sameDay || continuesToNext
          ? fixedColWidth + (finalEnd + 1) * responsiveDayColWidth
          : fixedColWidth + (finalEnd + 0.5) * responsiveDayColWidth;

      const width = right - left - horizontalGap;

      return { left, width, top: 0 };
    };

    const bookingsByDetailId: Record<string, Booking[]> = {};
    for (const booking of allBookings) {
      const key = (booking as any).reservationDetailId;
      if (key) {
        (bookingsByDetailId[key] ||= []).push(booking);
      }
    }

    const connectionLines = Object.entries(bookingsByDetailId).flatMap(
      ([detailId, bookings]) => {
        const sorted = [...bookings].sort(
          (a, b) =>
            new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
        );
        const lines: JSX.Element[] = [];

        for (let i = 0; i < sorted.length - 1; i++) {
          const from = sorted[i];
          const to = sorted[i + 1];

          const fromPos = computeBookingPosition(from);
          const toPos = computeBookingPosition(to);
          const fromTop =
            computeBookingTop(from) +
            (bookingRowMap[from.id] ?? 0) * bookingBlockHeight;
          const toTop =
            computeBookingTop(to) +
            (bookingRowMap[to.id] ?? 0) * bookingBlockHeight;

          if (!fromPos || !toPos) continue;

          const fromX = fromPos.left + fromPos.width;
          const fromY = fromTop + bookingBlockHeight / 2;
          const toX = toPos.left;
          const toY = toTop + bookingBlockHeight / 2;

          lines.push(
            <path
              key={`${detailId}-${i}`}
              d={`
      M ${fromX} ${fromY}
      C ${fromX + 40} ${fromY}, ${toX - 40} ${toY}, ${toX} ${toY}
    `}
              stroke="red"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          );
        }

        return lines;
      }
    );

    const computeOccupancyStats = () => {
      const filteredRoomTypes = roomTypes.filter(
        (type) => selectedRoomTypeId === "all" || type.id === selectedRoomTypeId
      );
      const filteredRoomIds = filteredRoomTypes.flatMap((type) =>
        type.rooms.map((room) => room.id)
      );
      const totalRooms = filteredRoomIds.length;

      const getOccupiedCount = (d: Date): number => {
        const currentDay = startOfDay(d).getTime();
        return new Set(
          allBookings
            .filter((b) => {
              const checkIn = startOfDay(new Date(b.checkIn)).getTime();
              const checkOut = b.checkOut
                ? startOfDay(new Date(b.checkOut)).getTime()
                : checkIn;
              if (checkIn === checkOut) {
                return checkIn === currentDay;
              }
              return checkIn <= currentDay && currentDay < checkOut;
            })
            .filter((b) => filteredRoomIds.includes(b.roomId))
            .map((b) => b.roomId)
        ).size;
      };

      return { totalRooms, getOccupiedCount };
    };

    // Compute occupancy stats per room type
    const getRoomTypeOccupancy = (roomType: RoomType, date: Date) => {
      const roomIds = roomType.rooms.map((room) => room.id);
      const totalRooms = roomIds.length;
      const currentDay = startOfDay(date).getTime();

      const occupiedRooms = new Set(
        allBookings
          .filter((b) => {
            const checkIn = startOfDay(new Date(b.checkIn)).getTime();
            const checkOut = b.checkOut
              ? startOfDay(new Date(b.checkOut)).getTime()
              : checkIn;
            if (checkIn === checkOut) {
              return checkIn === currentDay;
            }
            return checkIn <= currentDay && currentDay < checkOut;
          })
          .filter((b) => roomIds.includes(b.roomId))
          .map((b) => b.roomId)
      ).size;

      const availableRooms = totalRooms - occupiedRooms;
      return { available: availableRooms, total: totalRooms };
    };

    // Create a separate ref for the scrollable body section
    const scrollableBodyRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    // Sync horizontal scroll between header and body
    useEffect(() => {
      const bodyEl = scrollableBodyRef.current;
      const headerEl = headerScrollRef.current;

      if (!bodyEl || !headerEl) return;

      const syncBodyToHeader = () => {
        if (bodyEl && headerEl) {
          headerEl.scrollLeft = bodyEl.scrollLeft;
        }
      };

      bodyEl.addEventListener("scroll", syncBodyToHeader);

      return () => {
        bodyEl.removeEventListener("scroll", syncBodyToHeader);
      };
    }, []);

    useEffect(() => {
      const el = scrollableBodyRef.current;
      const overlay = overlayHostRef.current;
      if (!el || !overlay) return;

      let raf = 0;

      const handleMouseMove = (e: MouseEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const containerRect = el.getBoundingClientRect();
          const overlayRect = overlay.getBoundingClientRect();

          // Mouse position relative to SCROLLABLE BODY
          const xInContainer = e.clientX - containerRect.left;
          const yInContainer = e.clientY - containerRect.top;

          // Column hover (same as before)
          setCursorPos({ x: xInContainer, y: yInContainer });

          const colIndex = Math.floor(
            (xInContainer - fixedColWidth + el.scrollLeft) /
              responsiveDayColWidth
          );
          const colLeft =
            colIndex >= 0 && colIndex < dates.length
              ? fixedColWidth + colIndex * responsiveDayColWidth - el.scrollLeft
              : null;
          setHoveredColLeft(colLeft);

          // If pointer is above the overlay (i.e., on headers), clear row hover
          const overlayOffsetTopInContainer =
            overlayRect.top - containerRect.top;

          if (yInContainer < overlayOffsetTopInContainer) {
            setHoveredRoom(null);
            return;
          }

          // Convert to OVERLAY-relative Y (accounting for container scroll)
          const yInOverlay =
            yInContainer - overlayOffsetTopInContainer + el.scrollTop;

          // Detect which room row we're over using rowTopMap + real heights
          let found: { id: string; top: number; height: number } | null = null;
          for (const [roomId, top] of Object.entries(rowTopMap.current)) {
            const height = roomHeightMap[roomId] ?? rowHeight;
            if (yInOverlay >= top && yInOverlay <= top + height) {
              found = { id: roomId, top, height };
              break;
            }
          }
          setHoveredRoom(found);
        });
      };

      const handleMouseLeave = () => {
        setCursorPos(null);
        setHoveredColLeft(null);
        setHoveredRoom(null);
      };

      el.addEventListener("mousemove", handleMouseMove);
      el.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        cancelAnimationFrame(raf);
        el.removeEventListener("mousemove", handleMouseMove);
        el.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [
      responsiveDayColWidth,
      fixedColWidth,
      dates.length,
      rowHeight,
      roomHeightMap,
    ]);

    useEffect(() => {
      const finish = () => {
        if (!dragSel) return;

        const { roomId, startIdx, endIdx } = dragSel;
        const a = Math.min(startIdx, endIdx);
        const b = Math.max(startIdx, endIdx);

        // reject if any cell in the span is occupied
        const occ = occupiedByRoom[roomId] || new Set<number>();
        for (let i = a; i <= b; i++) {
          if (occ.has(i)) {
            setDragSel(null);
            return;
          }
        }

        // compute date range: [checkIn, checkOut)
        const startDate = startOfDay(dates[a]);
        const endDate = startOfDay(addDays(dates[b], 1));

        const roomNumber =
          roomTypes.flatMap((t) => t.rooms).find((r) => r.id === roomId)
            ?.number ?? "";

        // onSelectRange?.({
        //   roomId,
        //   roomNumber,
        //   roomTypeId: dragSel.roomTypeId,
        //   roomTypeName: dragSel.roomTypeName,
        //   startDate,
        //   endDate,
        // });
        setDragSel(null);
      };

      const onUp = () => finish();

      window.addEventListener("mouseup", onUp);
      return () => window.removeEventListener("mouseup", onUp);
    }, [dragSel, dates, occupiedByRoom, roomTypes]);

    const [hoveredBooking, setHoveredBooking] = useState<{
      booking: Booking;
      x: number;
      y: number;
      place: "top" | "bottom";
    } | null>(null);

    // Helper: compute tooltip position relative to the scrollable container
    const computeTooltipPos = (e: React.MouseEvent) => {
      if (!containerRef.current)
        return { x: 0, y: 0, place: "bottom" as const };

      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // cursor position relative to the scrollable container
      const cursorX = e.clientX - rect.left + scrollLeft;
      const cursorY = e.clientY - rect.top + scrollTop;

      // expected tooltip size (match your real tooltip)
      const tooltipW = 260;
      const tooltipH = 160;
      const gap = 12;

      const maxW = rect.width;
      const maxH = rect.height;

      // available space in each direction
      const spaceRight = scrollLeft + maxW - cursorX;
      const spaceBelow = scrollTop + maxH - cursorY;

      // horizontal placement (prefer right of cursor)
      let x =
        cursorX + (spaceRight >= tooltipW + gap ? gap : -(tooltipW + gap));
      // vertical placement: flip up if not enough room below
      const place =
        spaceBelow >= tooltipH + gap ? ("bottom" as const) : ("top" as const);
      let y = place === "bottom" ? cursorY + gap : cursorY - tooltipH - gap;

      // clamp inside the visible scroll area
      x = Math.min(
        Math.max(x, scrollLeft + 4),
        scrollLeft + maxW - tooltipW - 4
      );
      y = Math.min(Math.max(y, scrollTop + 4), scrollTop + maxH - tooltipH - 4);

      return { x, y, place };
    };

    // Helper: room number lookup (used in tooltip)
    const getRoomNumber = (roomId: string) =>
      roomTypes.flatMap((t) => t.rooms).find((r) => r.id === roomId)?.number ??
      "-";

    return (
      <div
        ref={containerRef}
        className="relative flex flex-col rounded-lg border border-gray-300 border-opacity-40 border-b border-b-[0.5px] w-full h-full"
      >
        {hotelDate && (
          <div className="text-xs text-muted-foreground px-2 py-1 shrink-0">
            Hotel Date: {hotelDate.toLocaleDateString()}{" "}
            {hotelDate.toLocaleTimeString()}
          </div>
        )}
        <div className="relative w-full flex flex-col flex-1 min-h-0">
          {/* Fixed Header Section - Does NOT scroll vertically, but scrolls horizontally */}
          <div
            ref={headerScrollRef}
            className="overflow-x-auto overflow-y-hidden shrink-0 border-b border-gray-300 border-opacity-40"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <Table>
              <TableHeader>
                <TableRow className="border border-gray-300 border-opacity-40 border-[0.5px]">
                  <TableHead
                    className="border border-gray-300 border-opacity-40 border-[0.5px] p-1"
                    style={{ width: `${fixedColWidth}px` }}
                  >
                    <div className="flex flex-col items-start">
                      <div className="relative w-full">
                        <div className="flex items-center gap-1 pl-2 text-[12px] font-medium text-muted-foreground">
                          <span>
                            {roomTypes.find(
                              (rt) => rt.id === selectedRoomTypeId
                            )?.name || "Rooms"}
                          </span>
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <select
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          value={selectedRoomTypeId}
                          onChange={(e) =>
                            setSelectedRoomTypeId(e.target.value)
                          }
                        >
                          <option value="all"> Rooms</option>
                          {roomTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </TableHead>
                  {dates.map((d, i) => (
                    <TableHead
                      key={i}
                      className="text-center text-xs p-0 border border-gray-300 border-opacity-40 border-[0.5px]"
                      style={{ width: `${responsiveDayColWidth}px` }}
                    >
                      <div
                        className={`py-1 rounded-t-md ${
                          systemDate &&
                          startOfDay(new Date(systemDate)).getTime() ===
                            startOfDay(d).getTime()
                            ? "bg-green-100 text-black font-semibold shadow-inner"
                            : [0, 6].includes(d.getDay())
                            ? "bg-red-100 text-red-700 font-medium"
                            : ""
                        }`}
                      >
                        <div>{format(d, "EEE")}</div>
                        <div>{format(d, "MMM d")}</div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="border border-gray-300 border-opacity-40 border-[0.5px] h-[20px]">
                  <TableCell
                    className="border border-gray-300 border-opacity-40 border-[0.5px] pl-3 text-[11px] font-medium text-muted-foreground py-[2px]"
                    style={{ width: `${fixedColWidth}px` }}
                  >
                    Availability
                  </TableCell>
                  {dates.map((d, i) => {
                    const dayStr = format(d, "yyyy-MM-dd");
                    const totalForDate = (roomAvailability ?? []).reduce(
                      (sum, type) => {
                        const match = type.availability.find(
                          (a) =>
                            format(new Date(a.date), "yyyy-MM-dd") === dayStr
                        );
                        return sum + (match?.count || 0);
                      },
                      0
                    );
                    return (
                      <TableCell
                        key={i}
                        className="text-center text-[10px] p-[2px] border border-gray-300 border-opacity-40 border-[0.5px] text-muted-foreground h-[20px]"
                        style={{ width: `${responsiveDayColWidth}px` }}
                      >
                        {totalForDate}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {(() => {
                  const { totalRooms, getOccupiedCount } =
                    computeOccupancyStats();

                  return (
                    <>
                      {/* Occupied Row */}
                      <TableRow className="border border-gray-300 border-opacity-40 border-[0.5px] h-[20px]">
                        <TableCell
                          className="pl-3 text-[11px] font-medium text-muted-foreground py-[2px] border-[1px]"
                          style={{ width: `${fixedColWidth}px` }}
                        >
                          Occupied
                        </TableCell>
                        {dates.map((d, i) => (
                          <TableCell
                            key={i}
                            className="text-center text-[10px] p-[2px] border border-gray-300 border-opacity-40 text-muted-foreground"
                            style={{ width: `${responsiveDayColWidth}px` }}
                          >
                            {getOccupiedCount(d)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Occupancy % Row */}
                      <TableRow className="border border-gray-300 border-opacity-40 border-[0.5px] h-[20px] ">
                        <TableCell
                          className="pl-3 text-[11px] font-medium text-muted-foreground py-[2px] border-[0.5px] "
                          style={{ width: `${fixedColWidth}px` }}
                        >
                          Occupancy %
                        </TableCell>
                        {dates.map((d, i) => {
                          const occupied = getOccupiedCount(d);
                          const percentage = totalRooms
                            ? Math.round((occupied / totalRooms) * 100)
                            : 0;
                          return (
                            <TableCell
                              key={i}
                              className="text-center text-[10px] p-[2px] border border-gray-300 border-opacity-40 text-muted-foreground"
                              style={{ width: `${responsiveDayColWidth}px` }}
                            >
                              {percentage}%
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Total (All) Row */}
                      <TableRow className="border border-gray-300 border-opacity-40 border-[0.5px] h-[20px]">
                        <TableCell
                          className="pl-3 text-[11px] font-semibold text-muted-foreground py-[2px]"
                          style={{ width: `${fixedColWidth}px` }}
                        >
                          Total (All)
                        </TableCell>
                        {dates.map((d, i) => {
                          const currentDay = startOfDay(d).getTime();
                          const totalRoomCount = roomTypes.reduce(
                            (count, type) => count + type.rooms.length,
                            0
                          );
                          const occupied = new Set(
                            allBookings
                              .filter((b) => {
                                const checkIn = startOfDay(
                                  new Date(b.checkIn)
                                ).getTime();
                                const checkOut = b.checkOut
                                  ? startOfDay(new Date(b.checkOut)).getTime()
                                  : checkIn;
                                if (checkIn === checkOut)
                                  return checkIn === currentDay;
                                return (
                                  checkIn <= currentDay && currentDay < checkOut
                                );
                              })
                              .map((b) => b.roomId)
                          ).size;
                          const percentage =
                            totalRoomCount > 0
                              ? Math.round((occupied / totalRoomCount) * 100)
                              : 0;
                          return (
                            <TableCell
                              key={i}
                              className="text-center text-[10px] p-[2px] border border-gray-300 border-opacity-40 text-muted-foreground"
                              style={{ width: `${responsiveDayColWidth}px` }}
                            >
                              {`${
                                totalRoomCount - occupied
                              } / ${occupied} (${percentage}%)`}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </>
                  );
                })()}
              </TableHeader>
            </Table>
          </div>
          {/* Scrollable Body Section - Rooms can scroll */}
          <div
            ref={scrollableBodyRef}
            className="flex-1 overflow-y-auto overflow-x-auto no-scrollbar min-h-0"
          >
            <div ref={overlayHostRef} className="relative">
              <Table className="border-separate border-spacing-0 w-full">
                <TableBody>
                  {roomTypes
                    .filter(
                      (type) =>
                        selectedRoomTypeId === "all" ||
                        type.id === selectedRoomTypeId
                    )
                    .map((type) => (
                      <React.Fragment key={type.id}>
                        <TableRow className="border border-gray-300 border-opacity-40 border-[0.5px]">
                          <TableCell
                            className="font-bold text-xs bg-muted/50 border border-gray-300 border-opacity-40 border-[0.5px] pl-3 py-1"
                            style={{ width: `${fixedColWidth}px` }}
                          >
                            {type.name}
                          </TableCell>
                          {dates.map((d, i) => {
                            const { available, total } = getRoomTypeOccupancy(
                              type,
                              d
                            );
                            return (
                              <TableCell
                                key={i}
                                className="text-center text-[10px] font-medium bg-muted/50 border border-gray-300 border-opacity-40 border-[0.5px] py-1"
                                style={{ width: `${responsiveDayColWidth}px` }}
                              >
                                {`${available}/${total}`}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        {type.rooms.map((room) => {
                          let rendered = false;
                          return (
                            <TableRow
                              key={room.id}
                              ref={(node) => {
                                if (!node || !overlayHostRef.current) return;

                                const host = overlayHostRef.current;

                                const measure = () => {
                                  const hostRect = host.getBoundingClientRect();
                                  const rowRect = node.getBoundingClientRect();

                                  const top = rowRect.top - hostRect.top; // coords relative to overlayHost
                                  const height = rowRect.height; // actual rendered height

                                  rowTopMap.current[room.id] = top; // keep your old map if others use it
                                  rowBoxMap.current[room.id] = { top, height }; // new precise map
                                };

                                // initial + observe changes (font, content, stacking, window resize)
                                measure();
                                const ro = new ResizeObserver(measure);
                                ro.observe(node);
                                // also re-measure on host resize
                                const hostRO = new ResizeObserver(measure);
                                hostRO.observe(host);

                                // store a cleanup on the node to disconnect observers when unmounted
                                (node as any).__ro__ = ro;
                                (node as any).__hostRO__ = hostRO;
                              }}
                              style={{
                                height: `${
                                  roomHeightMap[room.id] ?? rowHeight
                                }px`,
                                minHeight: `${
                                  roomHeightMap[room.id] ?? rowHeight
                                }px`,
                                maxHeight: `${
                                  roomHeightMap[room.id] ?? rowHeight
                                }px`,
                              }}
                              className="border border-gray-300 border-opacity-40 border-[0.5px]"
                            >
                              <TableCell
                                className="p-4-custom font-medium text-xs border border-gray-300 border-opacity-40 border-[0.5px]"
                                style={{ width: `${fixedColWidth}px` }}
                              >
                                {(() => {
                                  const effectiveStatus =
                                    hkOverride[room.id] ?? room.housekeepingStatus ?? "Clean";
                                  const isDirty = getHKDisplayName(effectiveStatus) === "Dirty";
                                  const isUpdating = !!hkUpdating[room.id];

                                  // console.log('Test of DOT color: ', effectiveStatus);
                                  // console.log('hkOverride[room.id]: ', hkOverride[room.id]);
                                  // console.log('room.housekeepingStatus: ', room.housekeepingStatus);
                                  // console.log('room: ', room);

                                  return (
                                    <div className="flex items-center gap-2">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            type="button"
                                            className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 ring-black/10 ${hkDotColor(
                                              effectiveStatus
                                            )} ${
                                              isUpdating
                                                ? "opacity-60 cursor-wait"
                                                : "cursor-pointer"
                                            }`}
                                            title={`HK: ${getHKDisplayName(effectiveStatus)} • Click to change`}
                                            disabled={isUpdating}
                                          />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          side="right"
                                          align="start"
                                          className="w-36"
                                        >
                                          {isDirty ? (
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleHkChange(room, "Clean")
                                              }
                                              disabled={isUpdating}
                                            >
                                              Mark Clean
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleHkChange(room, "Dirty")
                                              }
                                              disabled={isUpdating}
                                            >
                                              Mark Dirty
                                            </DropdownMenuItem>
                                          )}


                                          {/* If you want the extra options, uncomment these: */}
                                          {/* <DropdownMenuItem onClick={() => handleHkChange(room, "Occupied")} disabled={isUpdating}>
            Mark Occupied
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleHkChange(room, "WIP")} disabled={isUpdating}>
            Mark WIP
          </DropdownMenuItem> */}

                                        </DropdownMenuContent>
                                      </DropdownMenu>

                                      <span className="select-none">
                                        Room {room.number}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          (HK: {getHKDisplayName(effectiveStatus)})
                                        </span>
                                      </span>
                                    </div>
                                  );
                                })()}

                                {dates.map((date) => null)}
                              </TableCell>
                              {dates.map((date, di) => {
                                // keep your existing booking lookup so occupied cells render as before
                                const bookingsForCell = allBookings.filter(
                                  (b) =>
                                    b.roomId === room.id &&
                                    startOfDay(b.checkIn).getTime() <=
                                      startOfDay(date).getTime() &&
                                    (!b.checkOut ||
                                      startOfDay(b.checkOut).getTime() >
                                        startOfDay(date).getTime())
                                );

                                // NEW: fast occupied check for drag rules
                                const isOccupied =
                                  occupiedByRoom[room.id]?.has(di) ?? false;

                                // if there are bookings, render as you already do (no drag)
                                if (bookingsForCell.length > 0) {
                                  return (
                                    <TableCell
                                      key={di}
                                      className="relative h-auto p-0 border border-gray-300 border-opacity-40 border-[0.5px]"
                                      style={{
                                        width: `${responsiveDayColWidth}px`,
                                      }}
                                    >
                                      <div className="flex flex-col gap-[2px] py-[2px]"></div>
                                    </TableCell>
                                  );
                                }

                                // EMPTY CELL: enable drag-select here
                                return (
                                  <TableCell
                                    key={di}
                                    className="relative h-[16px] p-0 border border-gray-300 border-opacity-40 border-[0.5px]"
                                    style={{
                                      width: `${responsiveDayColWidth}px`,
                                    }}
                                    onMouseDown={(e) => {
                                      if (e.button !== 0) return;
                                      if (isOccupied) return;
                                      const { roomTypeId, roomTypeName } =
                                        getRoomTypeInfo(room.id);
                                      setDragSel({
                                        roomId: room.id,
                                        roomNumber: room.number,
                                        roomTypeId,
                                        roomTypeName,
                                        startIdx: di,
                                        endIdx: di,
                                      });
                                      e.preventDefault();
                                    }}
                                    onMouseEnter={() => {
                                      // extend selection only if dragging and only within same room
                                      if (!dragSel) return;
                                      if (dragSel.roomId !== room.id) return;
                                      // don’t extend into occupied cells
                                      if (isOccupied) return;
                                      setDragSel((sel) =>
                                        sel ? { ...sel, endIdx: di } : sel
                                      );
                                    }}
                                  >
                                    <div className="h-full w-full" />
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    ))}
                </TableBody>
              </Table>
              {allBookings.map((booking) => {
                const position = computeBookingPosition(booking);
                if (!position) return null;

                const stackIndex = bookingRowMap[booking.id] ?? 0;
                const verticalGap = 3;
                const topOffset =
                  computeBookingTop(booking) +
                  stackIndex * (bookingBlockHeight + verticalGap);

                return (
                  <div
                    key={booking.id}
                    onClick={() => handleReservationClick(booking)}
                    onMouseEnter={(e) => {
                      const pos = computeTooltipPos(e);
                      setHoveredBooking({ booking, ...pos });
                    }}
                    onMouseMove={(e) => {
                      const pos = computeTooltipPos(e);
                      setHoveredBooking((prev) =>
                        prev ? { booking, ...pos } : prev
                      );
                    }}
                    onMouseLeave={() => setHoveredBooking(null)}
                    className="absolute rounded-sm px-1 py-1 text-xs font-medium text-white shadow-md truncate whitespace-nowrap overflow-hidden cursor-pointer border border-white"
                    style={{
                      top: `${topOffset}px`,
                      left: `${position.left}px`,
                      width: `${position.width}px`,
                      backgroundColor: getBookingBgColor(booking),
                      zIndex: 10,
                      flexDirection: "row",
                      display: "flex",
                      gap: "4px",
                    }}
                    title={`${booking.guestName}`}
                  >
                    <AgentBadge
                      name={booking.sourceOfBooking || booking.guestName}
                      logo={booking.agentLogoURL}
                    />
                    {"  "}
                    {booking.guestName} — Room{" "}
                    {
                      roomTypes
                        .flatMap((t) => t.rooms)
                        .find((r) => r.id === booking.roomId)?.number
                    }
                  </div>
                );
              })}

              {(hoveredColLeft !== null || hoveredRoom) && (
                <div className="pointer-events-none absolute inset-0 z-[3]">
                  {hoveredColLeft !== null && (
                    <div
                      className="absolute top-0 h-full dark:bg-blue-50 bg-sky-300 dark:opacity-10 opacity-10"
                      style={{
                        left: `${hoveredColLeft}px`,
                        width: `${responsiveDayColWidth}px`,
                      }}
                    />
                  )}
                  {hoveredRoom && (
                    <div
                      className="absolute left-0 w-full dark:bg-blue-50 bg-sky-300 dark:opacity-10 opacity-10"
                      style={{
                        top: `${hoveredRoom.top}px`,
                        height: `${hoveredRoom.height}px`,
                      }}
                    />
                  )}
                </div>
              )}

              {selectionMenu && (
                <div
                  className="absolute z-[80] selection-menu-popover"
                  style={{
                    left: selectionMenu.x,
                    top: selectionMenu.y,
                    // if we placed it above, nudge up; if below, nudge down
                    transform:
                      selectionMenu.placement === "top"
                        ? "translate(-50%, -100%)" // above anchor y
                        : "translate(-50%, 0%)", // below anchor y
                  }}
                  aria-live="polite"
                >
                  {/* arrow tip */}
                  {selectionMenu.placement === "top" ? (
                    // Arrow sits at the BOTTOM edge pointing down to the selection
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 h-2 w-2 rotate-45 bg-background/90 border border-gray-200/60" />
                  ) : (
                    // Arrow sits at the TOP edge pointing up to the selection
                    <div className="absolute left-1/2 -top-1 -translate-x-1/2 h-2 w-2 rotate-45 bg-background/90 border border-gray-200/60" />
                  )}

                  <div
                    className="min-w-[180px] rounded-xl border border-gray-200/60 bg-background/90 backdrop-blur-md shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in-0 zoom-in-95"
                    role="menu"
                    aria-label="Selection actions"
                  >
                    <ul className="p-1.5">
                      <li>
                        <button
                          role="menuitem"
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium hover:bg-accent/60"
                          onClick={() => {
                            onQuickSelectRange?.(selectionMenu.payload);
                            setSelectionMenu(null);
                            setFinalSel(null);
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            className="opacity-80"
                          >
                            <path
                              d="M7 6h11M7 12h7M7 18h11"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </svg>
                          Quick reservation
                        </button>
                      </li>
                      <li>
                        <button
                          role="menuitem"
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium hover:bg-accent/60"
                          onClick={() => {
                            onBusinessSelectRange?.(selectionMenu.payload);
                            setSelectionMenu(null);
                            setFinalSel(null);
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            className="opacity-80"
                          >
                            <path
                              d="M3 7h18M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M4 7v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </svg>
                          Business block
                        </button>
                      </li>
                      <li>
                        <button
                          role="menuitem"
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium hover:bg-accent/60"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            className="opacity-80"
                          >
                            <path
                              d="M4 12h16M12 4v16"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </svg>
                          Out of order
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {(dragSel || finalSel) &&
                (() => {
                  const sel = dragSel ?? finalSel!;
                  const start = Math.min(sel.startIdx, sel.endIdx);
                  const end = Math.max(sel.startIdx, sel.endIdx);

                  const left = fixedColWidth + start * responsiveDayColWidth;
                  const width = Math.max(
                    0,
                    (end - start + 1) * responsiveDayColWidth
                  );

                  const box = rowBoxMap.current[sel.roomId];
                  const top = box?.top ?? rowTopMap.current[sel.roomId] ?? 0;
                  const height =
                    box?.height ?? roomHeightMap[sel.roomId] ?? rowHeight;

                  const startLabel = format(dates[start], "yyyy-MM-dd");
                  const endLabel = format(addDays(dates[end], 1), "yyyy-MM-dd");

                  return (
                    <div
                      className="pointer-events-none absolute z-[7]"
                      style={{ left, top, width, height }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "rgba(0, 255, 255, 0.65)",
                          border: "1px solid rgba(0,0,0,0.9)",
                          borderRadius: 2,
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 font-semibold text-[12px] leading-none select-none"
                        style={{ left: 8, whiteSpace: "nowrap" }}
                      >
                        {startLabel}
                      </div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 font-semibold text-[12px] leading-none select-none"
                        style={{ right: 8, whiteSpace: "nowrap" }}
                      >
                        {endLabel}
                      </div>
                    </div>
                  );
                })()}

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                    stroke="red"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="red" />
                  </marker>
                </defs>
                {connectionLines}
              </svg>

              {/* Legend */}

              <div
                className="flex flex-row flex-wrap 
                items-start content-start justify-center 
                gap-3 px-3 py-2 
                border-b border-gray-300 border-opacity-40 border-b-[0.5px] 
                bg-muted/50 text-xs 
                h-20 overflow-y-auto"
              >
                {Object.entries(statusLegend).map(([status, color]) => (
                  <div
                    key={status}
                    className="flex items-center justify-center gap-1"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {hoveredBooking && (
          <div
            className="absolute z-[60] pointer-events-none"
            style={{
              left: hoveredBooking.x,
              top: hoveredBooking.y,
              width: 260,
            }}
          >
            <div className="rounded-md border border-gray-300/60 bg-background text-foreground shadow-lg p-3 text-[12px]">
              <div className="flex items-center gap-2 mb-2">
                {(hoveredBooking.booking as any).agentLogoURL ? (
                  <Image
                    src={(hoveredBooking.booking as any).agentLogoURL}
                    alt="agent"
                    width={20}
                    height={20}
                  />
                ) : null}
                <div className="font-semibold truncate">
                  {hoveredBooking.booking.guestName}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                <div className="text-muted-foreground">Room</div>
                <div className="col-span-2 font-medium">
                  {getRoomNumber(hoveredBooking.booking.roomId)}
                </div>

                <div className="text-muted-foreground">Check-in</div>
                <div className="col-span-2">
                  {format(
                    new Date(hoveredBooking.booking.checkIn),
                    "MMM d, yyyy"
                  )}
                </div>

                <div className="text-muted-foreground">Check-out</div>
                <div className="col-span-2">
                  {hoveredBooking.booking.checkOut
                    ? format(
                        new Date(hoveredBooking.booking.checkOut),
                        "MMM d, yyyy"
                      )
                    : "—"}
                </div>

                <div className="text-muted-foreground">Nights</div>
                <div className="col-span-2">
                  {hoveredBooking.booking.checkOut
                    ? Math.max(
                        1,
                        differenceInCalendarDays(
                          new Date(hoveredBooking.booking.checkOut),
                          new Date(hoveredBooking.booking.checkIn)
                        )
                      )
                    : 1}
                </div>

                <div className="text-muted-foreground">Guests</div>
                <div className="col-span-2">
                  {hoveredBooking.booking.guests ?? "-"}
                </div>

                <div className="text-muted-foreground">Status</div>
                <div className="col-span-2 flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: getBookingBgColor(
                        hoveredBooking.booking as Booking
                      ),
                    }}
                  />
                  <span className="font-medium">
                    {hoveredBooking.booking.status}
                  </span>
                </div>
              </div>

              {/* Optional: reservation/source row if you have these */}
              {(hoveredBooking.booking as any).reservationNo && (
                <div className="mt-2 text-muted-foreground">
                  Ref:{" "}
                  <span className="text-foreground font-medium">
                    {(hoveredBooking.booking as any).reservationNo}
                  </span>
                </div>
              )}
              {(hoveredBooking.booking as any).sourceOfBooking && (
                <div className="text-muted-foreground">
                  Source:{" "}
                  <span className="text-foreground font-medium">
                    {(hoveredBooking.booking as any).sourceOfBooking}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

GridLayout.displayName = "GridLayout";
export default GridLayout;