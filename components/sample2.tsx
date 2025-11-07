"use client";

import React, { forwardRef, JSX, useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { format, startOfDay } from "date-fns";
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
import { differenceInCalendarDays } from "date-fns";

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
  agentLogoURL?: string;
  reservationNo?: string;
  source?: string;
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
}

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
      computeBookingPosition: _computeBookingPosition, // not used directly
      computeCellBasePosition,
      roomAvailability,
    },
    ref
  ) => {
    // ---- state/refs
    const [responsiveDayColWidth, setResponsiveDayColWidth] =
      useState(dayColWidth);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
      null
    );
    const [hoveredColLeft, setHoveredColLeft] = useState<number | null>(null);
    const { hotelId, accessToken } = useClientStorage();
    const [hoveredRoom, setHoveredRoom] = useState<{
      id: string;
      top: number;
      height: number;
    } | null>(null);

    const headerScrollRef = useRef<HTMLDivElement>(null);
    const bodyScrollRef = useRef<HTMLDivElement>(null);
    const overlayHostRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();
    const systemDate = useAppSelector(
      (state: RootState) => state.systemDate.value
    );
    useEffect(() => {
      dispatch(fetchSystemDate());
    }, [dispatch]);

    const hkDotColor = (status?: string) => {
      switch ((status || "").trim()) {
        case "Clean":
          return "bg-green-500";
        case "Occupied":
          return "bg-yellow-500";
        case "Dirty":
          return "bg-red-500";
        case "WIP":
          return "bg-blue-500";
        default:
          return "bg-black";
      }
    };

    // Optimistic HK overrides
    const [hkOverride, setHkOverride] = useState<Record<string, string>>({});
    const [hkUpdating, setHkUpdating] = useState<Record<string, boolean>>({});

    const handleHkChange = async (
      room: Room,
      next: "Clean" | "Dirty" | "Occupied" | "WIP"
    ) => {
      const roomKey = room.id.toString();
      const prev = hkOverride[roomKey] ?? room.housekeepingStatus ?? "Clean";

      setHkOverride((m) => ({ ...m, [roomKey]: next }));
      setHkUpdating((m) => ({ ...m, [roomKey]: true }));

      const payload: UpdateHousekeepingPayload = {
        id: Number(roomKey),
        housekeepingStatus: next,
      };

      const action = await dispatch(updateHousekeepingStatus(payload));
      setHkUpdating((m) => ({ ...m, [roomKey]: false }));

      if (updateHousekeepingStatus.rejected.match(action)) {
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

    // normalize room ids to string
    roomTypes = roomTypes.map((type) => ({
      ...type,
      rooms: type.rooms.map((room) => ({ ...room, id: room.id.toString() })),
    }));

    // map to store measured row tops
    const rowTopMap = useRef<Record<string, number>>({});

    const normalizeBookings = (raw: Booking[]): Booking[] =>
      raw.map((b) => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: b.checkOut ? new Date(b.checkOut) : undefined,
      }));

    // all bookings
    const allBookings = normalizeBookings([
      ...nonSameDayBookings,
      ...sameDayBookings,
    ]);

    // bookings grouped by room for stacking
    const bookingsByRoom: Record<string, Booking[]> = {};
    allBookings.forEach((bk) => {
      (bookingsByRoom[bk.roomId] ||= []).push(bk);
    });
    Object.values(bookingsByRoom).forEach((arr) =>
      arr.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
    );

    // stack rows per room (no overlaps per row)
    const bookingRowMap: Record<string, number> = {};
    const rowsByRoom: Record<string, Booking[][]> = {};
    const overlaps = (a: Booking, b: Booking) => {
      const aStart = +new Date(a.checkIn);
      const aEnd = a.checkOut ? +new Date(a.checkOut) : aStart;
      const bStart = +new Date(b.checkIn);
      const bEnd = b.checkOut ? +new Date(b.checkOut) : bStart;
      return !(aEnd <= bStart || bEnd <= aStart);
    };
    for (const [roomId, arr] of Object.entries(bookingsByRoom)) {
      const rows: Booking[][] = [];
      for (const bk of arr) {
        let placed = false;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].every((other) => !overlaps(bk, other))) {
            rows[i].push(bk);
            bookingRowMap[bk.id] = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          rows.push([bk]);
          bookingRowMap[bk.id] = rows.length - 1;
        }
      }
      rowsByRoom[roomId] = rows;
    }

    // height required per room row
    const roomHeightMap: Record<string, number> = {};
    for (const [roomId, rows] of Object.entries(rowsByRoom)) {
      const peak = rows.length;
      const requiredHeight = peak * bookingBlockHeight + (peak - 1) * 2;
      roomHeightMap[roomId] = Math.max(rowHeight, requiredHeight);
    }

    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("all");
    const [hotelDate, setHotelDate] = useState<Date | null>(null);

    useEffect(() => {
      if (!accessToken || !hotelId) return;
      axios
        .get(`${BASE_URL}/api/Hotel/${hotelId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          const hotelDateStr = response.data.hotelDate;
          if (hotelDateStr) setHotelDate(new Date(hotelDateStr));
        })
        .catch((error) => console.error("Failed to fetch hotel date:", error));
    }, [accessToken, hotelId]);

    // keep header horizontally synced with body
    useEffect(() => {
      const headerEl = headerScrollRef.current;
      const bodyEl = bodyScrollRef.current;
      if (!headerEl || !bodyEl) return;
      const onBodyScroll = () => {
        headerEl.scrollLeft = bodyEl.scrollLeft;
      };
      bodyEl.addEventListener("scroll", onBodyScroll, { passive: true });
      return () => bodyEl.removeEventListener("scroll", onBodyScroll);
    }, []);

    // resize: recompute responsive col width based on body scroller
    useEffect(() => {
      const updateWidth = () => {
        requestAnimationFrame(() => {
          const el = bodyScrollRef.current;
          if (el) {
            const containerWidth = el.clientWidth - fixedColWidth;
            const newDayColWidth = containerWidth / dates.length;
            setResponsiveDayColWidth(newDayColWidth);
          }
        });
      };
      updateWidth();
      const ro = new ResizeObserver(updateWidth);
      if (bodyScrollRef.current) ro.observe(bodyScrollRef.current);
      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
        ro.disconnect();
      };
    }, [dates.length, fixedColWidth]);

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // compute top of a booking (DOM-measured when available)
    const computeBookingTop = (booking: Booking): number => {
      const domOffset = rowTopMap.current[booking.roomId];
      if (typeof domOffset === "number") return domOffset;

      // fallback (before refs resolve) — approximate
      const STATIC_HEADER_ROWS = 2; // header "Rooms/Dates" + "Availability"
      let offset = STATIC_HEADER_ROWS * rowHeight;
      const visibleTypes = roomTypes.filter(
        (t) => selectedRoomTypeId === "all" || t.id === selectedRoomTypeId
      );
      for (const type of visibleTypes) {
        offset += rowHeight; // type header
        for (const r of type.rooms) {
          if (r.id === booking.roomId) return offset;
          offset += roomHeightMap[r.id] ?? rowHeight;
        }
      }
      return offset;
    };

    // booking bar left/width computation (center-to-center for multi-day)
    const computeBookingPosition = (booking: Booking) => {
      const checkInTime = startOfDay(booking.checkIn).getTime();
      const checkOutTime = booking.checkOut
        ? startOfDay(booking.checkOut).getTime()
        : checkInTime;

      const gridStartTime = startOfDay(dates[0]).getTime();
      const gridEndTime = startOfDay(dates[dates.length - 1]).getTime();

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
      const horizontalGap = 2;

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

    // connecting lines for same reservationDetailId
    const bookingsByDetailId: Record<string, Booking[]> = {};
    for (const booking of allBookings) {
      const key = (booking as any).reservationDetailId;
      if (key) (bookingsByDetailId[key] ||= []).push(booking);
    }
    const connectionLines = Object.entries(bookingsByDetailId).flatMap(
      ([detailId, bookings]) => {
        const sorted = [...bookings].sort(
          (a, b) => +new Date(a.checkIn) - +new Date(b.checkIn)
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
              d={`M ${fromX} ${fromY} C ${fromX + 40} ${fromY}, ${
                toX - 40
              } ${toY}, ${toX} ${toY}`}
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

    // occupancy summaries
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
              if (checkIn === checkOut) return checkIn === currentDay;
              return checkIn <= currentDay && currentDay < checkOut;
            })
            .filter((b) => filteredRoomIds.includes(b.roomId))
            .map((b) => b.roomId)
        ).size;
      };

      return { totalRooms, getOccupiedCount };
    };

    // hover/highlight logic — attach to body scroller
    useEffect(() => {
      const el = bodyScrollRef.current;
      const overlay = overlayHostRef.current;
      if (!el || !overlay) return;

      let raf = 0;

      const handleMouseMove = (e: MouseEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const containerRect = el.getBoundingClientRect();
          const overlayRect = overlay.getBoundingClientRect();

          const xInContainer = e.clientX - containerRect.left;
          const yInContainer = e.clientY - containerRect.top;

          setCursorPos({ x: xInContainer, y: yInContainer });

          const colIndex = Math.floor(
            (xInContainer - fixedColWidth) / responsiveDayColWidth
          );
          const colLeft =
            colIndex >= 0 && colIndex < dates.length
              ? fixedColWidth + colIndex * responsiveDayColWidth
              : null;
          setHoveredColLeft(colLeft);

          const overlayOffsetTopInContainer =
            overlayRect.top - containerRect.top;

          if (yInContainer < overlayOffsetTopInContainer) {
            setHoveredRoom(null);
            return;
          }

          const yInOverlay =
            yInContainer - overlayOffsetTopInContainer + el.scrollTop;

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

    const [hoveredBooking, setHoveredBooking] = useState<{
      booking: Booking;
      x: number;
      y: number;
      place: "top" | "bottom";
    } | null>(null);

    // tooltip position: base on body scroller
    const computeTooltipPos = (e: React.MouseEvent) => {
      const el = bodyScrollRef.current;
      if (!el) return { x: 0, y: 0, place: "bottom" as const };

      const rect = el.getBoundingClientRect();
      const scrollLeft = el.scrollLeft;
      const scrollTop = el.scrollTop;

      const cursorX = e.clientX - rect.left + scrollLeft;
      const cursorY = e.clientY - rect.top + scrollTop;

      const tooltipW = 260;
      const tooltipH = 160;
      const gap = 12;

      const maxW = rect.width;
      const maxH = rect.height;

      const spaceRight = scrollLeft + maxW - cursorX;
      const spaceBelow = scrollTop + maxH - cursorY;

      let x =
        cursorX + (spaceRight >= tooltipW + gap ? gap : -(tooltipW + gap));
      const place =
        spaceBelow >= tooltipH + gap ? ("bottom" as const) : ("top" as const);
      let y = place === "bottom" ? cursorY + gap : cursorY - tooltipH - gap;

      x = Math.min(
        Math.max(x, scrollLeft + 4),
        scrollLeft + maxW - tooltipW - 4
      );
      y = Math.min(Math.max(y, scrollTop + 4), scrollTop + maxH - tooltipH - 4);

      return { x, y, place };
    };

    // room number helper
    const getRoomNumber = (roomId: string) =>
      roomTypes.flatMap((t) => t.rooms).find((r) => r.id === roomId)?.number ??
      "-";

    // ---- RENDER
    return (
      <div
        // outer shell: not scrollable
        className="relative h-full min-h-0 w-full flex flex-col rounded-lg border border-gray-300/40"
        ref={ref}
      >
        {hotelDate && (
          <div className="text-xs text-muted-foreground px-2 py-1">
            Hotel Date: {hotelDate.toLocaleDateString()}{" "}
            {hotelDate.toLocaleTimeString()}
          </div>
        )}

        {/* FIXED HEADER (mirrors horizontal scroll only) */}
        <div
          ref={headerScrollRef}
          className="relative w-full shrink-0 overflow-hidden"
        >
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border border-gray-300/40">
                  <TableHead
                    className="border border-gray-300/40 p-1"
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
                      className="text-center text-xs p-0 border border-gray-300/40"
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

                {/* Availability Row */}
                <TableRow className="border border-gray-300/40 h-[20px]">
                  <TableCell
                    className="border border-gray-300/40 pl-3 text-[11px] font-medium text-muted-foreground py-[2px]"
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
                        className="text-center text-[10px] p-[2px] border border-gray-300/40 text-muted-foreground h-[20px]"
                        style={{ width: `${responsiveDayColWidth}px` }}
                      >
                        {totalForDate}
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Occupancy Summaries */}
                {(() => {
                  const { totalRooms, getOccupiedCount } =
                    computeOccupancyStats();
                  return (
                    <>
                      <TableRow className="border border-gray-300/40 h-[20px]">
                        <TableCell
                          className="pl-3 text-[11px] font-medium text-muted-foreground py-[2px] border"
                          style={{ width: `${fixedColWidth}px` }}
                        >
                          Occupied
                        </TableCell>
                        {dates.map((d, i) => (
                          <TableCell
                            key={i}
                            className="text-center text-[10px] p-[2px] border border-gray-300/40 text-muted-foreground"
                            style={{ width: `${responsiveDayColWidth}px` }}
                          >
                            {getOccupiedCount(d)}
                          </TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="border border-gray-300/40 h-[20px]">
                        <TableCell
                          className="pl-3 text-[11px] font-medium text-muted-foreground py-[2px] border"
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
                              className="text-center text-[10px] p-[2px] border border-gray-300/40 text-muted-foreground"
                              style={{ width: `${responsiveDayColWidth}px` }}
                            >
                              {percentage}%
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      <TableRow className="border border-gray-300/40 h-[20px]">
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
                              className="text-center text-[10px] p-[2px] border border-gray-300/40 text-muted-foreground"
                              style={{ width: `${responsiveDayColWidth}px` }}
                            >{`${
                              totalRoomCount - occupied
                            } / ${occupied} (${percentage}%)`}</TableCell>
                          );
                        })}
                      </TableRow>
                    </>
                  );
                })()}
              </TableHeader>
            </Table>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 min-h-0 overflow-auto" ref={bodyScrollRef}>
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
                      <TableRow className="border border-gray-300/40">
                        <TableCell
                          colSpan={dates.length + 1}
                          className="font-bold text-xs bg-muted/50 border border-gray-300/40"
                        >
                          {type.name}
                        </TableCell>
                      </TableRow>

                      {type.rooms.map((room) => (
                        <TableRow
                          key={room.id}
                          ref={(node) => {
                            if (node && overlayHostRef.current) {
                              const hostTop =
                                overlayHostRef.current.getBoundingClientRect()
                                  .top;
                              const rowTop =
                                node.getBoundingClientRect().top - hostTop;
                              rowTopMap.current[room.id] = rowTop;
                            }
                          }}
                          style={{
                            height: `${roomHeightMap[room.id] ?? rowHeight}px`,
                            minHeight: `${
                              roomHeightMap[room.id] ?? rowHeight
                            }px`,
                            maxHeight: `${
                              roomHeightMap[room.id] ?? rowHeight
                            }px`,
                          }}
                          className="border border-gray-300/40"
                        >
                          <TableCell
                            className="p-4-custom font-medium text-xs border border-gray-300/40"
                            style={{ width: `${fixedColWidth}px` }}
                          >
                            {(() => {
                              const effectiveStatus =
                                hkOverride[room.id] ??
                                room.housekeepingStatus ??
                                "Clean";
                              const isDirty = effectiveStatus === "Dirty";
                              const isUpdating = !!hkUpdating[room.id];

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
                                        title={`HK: ${effectiveStatus} • Click to change`}
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
                                    </DropdownMenuContent>
                                  </DropdownMenu>

                                  <span className="select-none">
                                    Room {room.number}
                                  </span>
                                </div>
                              );
                            })()}

                            {dates.map((date) => null)}
                          </TableCell>

                          {dates.map((date, di) => {
                            const bookingsForCell = allBookings.filter(
                              (b) =>
                                b.roomId === room.id &&
                                startOfDay(b.checkIn).getTime() <=
                                  startOfDay(date).getTime() &&
                                (!b.checkOut ||
                                  startOfDay(b.checkOut).getTime() >
                                    startOfDay(date).getTime())
                            );
                            if (bookingsForCell.length > 0) {
                              return (
                                <TableCell
                                  key={di}
                                  className="relative h-auto p-0 border border-gray-300/40"
                                  style={{
                                    width: `${responsiveDayColWidth}px`,
                                  }}
                                >
                                  <div className="flex flex-col gap-[2px] py-[2px]" />
                                </TableCell>
                              );
                            } else {
                              return (
                                <TableCell
                                  key={di}
                                  className="relative h-[16px] p-0 border border-gray-300/40"
                                  style={{
                                    width: `${responsiveDayColWidth}px`,
                                  }}
                                />
                              );
                            }
                          })}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
              </TableBody>
            </Table>

            {/* Booking blocks */}
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
                  className="absolute rounded-sm px-1 py-1 text-xs font-medium text-white shadow-md truncate whitespace-nowrap overflow-hidden cursor-pointer border border-white flex gap-1"
                  style={{
                    top: `${topOffset}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                    backgroundColor: booking.statusColor || "#ccc",
                    zIndex: 10,
                  }}
                  title={`${booking.guestName}`}
                >
                  <AgentBadge
                    name={booking.source || booking.guestName}
                    logo={booking.agentLogoURL}
                  />
                  {booking.guestName} — Room{" "}
                  {
                    roomTypes
                      .flatMap((t) => t.rooms)
                      .find((r) => r.id === booking.roomId)?.number
                  }
                </div>
              );
            })}

            {/* Hover highlights */}
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
          </div>
        </div>

        {/* Tooltip (positioned relative to outer shell) */}
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
                {hoveredBooking.booking.agentLogoURL ? (
                  <Image
                    src={hoveredBooking.booking.agentLogoURL}
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
                      backgroundColor:
                        hoveredBooking.booking.statusColor ||
                        statusColors[hoveredBooking.booking.status] ||
                        "#999",
                    }}
                  />
                  <span className="font-medium">
                    {hoveredBooking.booking.status}
                  </span>
                </div>
              </div>

              {hoveredBooking.booking.reservationNo && (
                <div className="mt-2 text-muted-foreground">
                  Ref:{" "}
                  <span className="text-foreground font-medium">
                    {hoveredBooking.booking.reservationNo}
                  </span>
                </div>
              )}
              {(hoveredBooking.booking as any).source && (
                <div className="text-muted-foreground">
                  Source:{" "}
                  <span className="text-foreground font-medium">
                    {(hoveredBooking.booking as any).source}
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
