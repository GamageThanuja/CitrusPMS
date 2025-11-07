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
import { editRoomMas } from "@/redux/slices/editRoomMasSlice";
import { updateRoomHousekeepingStatus } from "@/redux/slices/roomMasSlice";
import { differenceInCalendarDays } from "date-fns";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Models ---
interface Room {
  id: string;
  number: string;
  rate: number;
  housekeepingStatus?: "Clean" | "Occupied" | "Dirty" | "WIP" | string;
  houseKeepingStatusID?: number; // 1=Clean, 2=Dirty, 5=WIP, 6=Occupied Clean, 7=Occupied Dirty
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
  sourceOfBooking?: string;
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
  onSelectRange?: (payload: {
    roomId: string;
    roomNumber: string;
    startDate: Date;
    endDate: Date;
    roomTypeId: string;
    roomTypeName: string;
  }) => void;
}

type DragSel = {
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  startIdx: number;
  endIdx: number;
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
      onSelectRange,
    },
    ref
  ) => {
    console.log("roomAvailability aaaa : ", roomAvailability);

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

    const [dragSel, setDragSel] = useState<DragSel>(null);

    console.log("hotel id :", hotelId);
    console.log("accessToken :", accessToken);
    console.log("room type list :", roomTypes);

    const dispatch = useDispatch();
    const systemDate = useAppSelector(
      (state: RootState) => state.systemDate.value
    );
    const roomMasData = useAppSelector((state: RootState) => state.roomMas?.items || []);

    // Helper function to get the current housekeeping status from Redux store
    const getCurrentHkStatus = (roomId: string): number => {
      const roomFromStore = roomMasData.find(room => room.roomID.toString() === roomId);
      return hkOverride[roomId] ?? roomFromStore?.houseKeepingStatusID ?? 1;
    };

    useEffect(() => {
      dispatch(fetchSystemDate());
    }, [dispatch]);

    const commitDrag = useCallback(() => {
      if (!dragSel || !onSelectRange) return;

      const start = Math.min(dragSel.startIdx, dragSel.endIdx);
      const endInclusive = Math.max(dragSel.startIdx, dragSel.endIdx);
      const endExclusive = Math.min(endInclusive + 1, dates.length);

      const startDate = dates[start];
      const endDate =
        endExclusive < dates.length
          ? dates[endExclusive]
          : new Date(dates[dates.length - 1].getTime() + 24 * 60 * 60 * 1000);

      onSelectRange({
        roomId: dragSel.roomId,
        roomNumber: dragSel.roomNumber,
        startDate,
        endDate,
        roomTypeId: dragSel.roomTypeId,
        roomTypeName: dragSel.roomTypeName,
      });

      setDragSel(null);
    }, [dragSel, onSelectRange, dates]);

    useEffect(() => {
      const up = () => commitDrag();
      const esc = (e: KeyboardEvent) => e.key === "Escape" && setDragSel(null);
      window.addEventListener("mouseup", up);
      window.addEventListener("keydown", esc);
      return () => {
        window.removeEventListener("mouseup", up);
        window.removeEventListener("keydown", esc);
      };
    }, [commitDrag]);

    const didInitialCenter = useRef(false);

    function centerOnColumn(index: number) {
      if (!containerRef.current) return;

      const viewport =
        containerRef.current.clientWidth - Math.max(0, fixedColWidth);

      const colLeft = fixedColWidth + index * responsiveDayColWidth;

      const targetScrollLeft = Math.max(
        0,
        colLeft - (viewport - responsiveDayColWidth) / 2
      );

      containerRef.current.scrollLeft = targetScrollLeft;
    }

    useEffect(() => {
      if (didInitialCenter.current) return;
      if (!systemDate || !dates?.length || !responsiveDayColWidth) return;

      const sys = startOfDay(new Date(systemDate)).getTime();
      const idx = dates.findIndex((d) => startOfDay(d).getTime() === sys);
      if (idx !== -1) {
        requestAnimationFrame(() => {
          centerOnColumn(idx);
          didInitialCenter.current = true;
        });
      }
    }, [dates, responsiveDayColWidth, systemDate, fixedColWidth]);

    function getRoomTypeInfo(roomId: string) {
      for (const rt of roomTypes) {
        const match = rt.rooms.find((r) => r.id === roomId);
        if (match) return { roomTypeId: String(rt.id), roomTypeName: rt.name };
      }
      return { roomTypeId: "", roomTypeName: "" };
    }

    useEffect(() => {
      if (!didInitialCenter.current) return;
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = 0;
    }, [dates]);

    console.log("System Date in Quick Reservation Drawer:", systemDate);
    const overlayHostRef = useRef<HTMLDivElement>(null);
    const isToday = systemDate;

    const hkDotColor = (statusID?: number) => {
      switch (statusID) {
        case 1: // Clean
          return "bg-green-500";
        case 2: // Dirty
          return "bg-red-500";
        case 5: // WIP
          return "bg-blue-500";
        case 6: // Occupied Clean
          return "bg-yellow-500";
        case 7: // Occupied Dirty
          return "bg-orange-500";
        default:
          return "bg-gray-400";
      }
    };

    const hkStatusLabel = (statusID?: number) => {
      switch (statusID) {
        case 1:
          return "Clean";
        case 2:
          return "Dirty";
        case 5:
          return "WIP";
        case 6:
          return "Occupied Clean";
        case 7:
          return "Occupied Dirty";
        default:
          return "Unknown";
      }
    };

    // Optimistic HK overrides so the dot updates immediately
    const [hkOverride, setHkOverride] = useState<Record<string, number>>({});
    const [hkUpdating, setHkUpdating] = useState<Record<string, boolean>>({});

    

    // Housekeeping status updater using RoomMas PUT endpoint
    const handleHkChange = async (room: Room, nextStatusID: number) => {
      const roomKey = room.id.toString();

      console.log("room key :", roomKey);  

      // optimistic update
      setHkOverride((m) => ({ ...m, [roomKey]: nextStatusID }));
      setHkUpdating((m) => ({ ...m, [roomKey]: true }));

      // identify roomType from current grid data
      const { roomTypeId } = getRoomTypeInfo(room.id);

      // Dispatch PUT /api/RoomMas/{roomTypeId}/{roomId}/{roomNumber}
      const action = await (dispatch as any)(
        editRoomMas({
          roomTypeId: Number(roomTypeId),
          roomId: Number(roomKey),
          roomNumber: room.number,
          body: {
            houseKeepingStatusID: nextStatusID,
          },
        })
      );

      // unset updating flag
      setHkUpdating((m) => ({ ...m, [roomKey]: false }));

      if (editRoomMas.rejected.match(action)) {
        // revert on failure
        setHkOverride((m) => ({ ...m, [roomKey]: room.houseKeepingStatusID ?? 1 }));
        toast.error(
          (action as any)?.payload ||
            `Failed to update housekeeping for room ${room.number}`
        );
      } else {
        // Update the Redux store with the new housekeeping status
        (dispatch as any)(updateRoomHousekeepingStatus({
          roomID: Number(roomKey),
          houseKeepingStatusID: nextStatusID
        }));
        
        // Clear the optimistic override since the store is now updated
        setHkOverride((m) => {
          const newMap = { ...m };
          delete newMap[roomKey];
          return newMap;
        });
        
        toast.success(`Room ${room.number} marked ${hkStatusLabel(nextStatusID)}`);
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

    useEffect(() => {
      const updateWidth = () => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            const containerWidth =
              containerRef.current.getBoundingClientRect().width -
              fixedColWidth;
            const newDayColWidth = containerWidth / dates.length;
            setResponsiveDayColWidth(newDayColWidth);
          }
        });
      };

      updateWidth();
      const resizeObserver = new ResizeObserver(updateWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
        if (containerRef.current)
          resizeObserver.unobserve(containerRef.current);
      };
    }, [dates.length, fixedColWidth]);

    roomTypes = roomTypes.map((type) => ({
      ...type,
      rooms: type.rooms.map((room) => ({
        ...room,
        id: room.id.toString(),
      })),
    }));

    const rowTopMap = useRef<Record<string, number>>({});

    const normalizeBookings = (raw: Booking[]): Booking[] =>
      raw.map((b) => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: b.checkOut ? new Date(b.checkOut) : undefined,
      }));

    const allBookings = normalizeBookings([
      ...nonSameDayBookings,
      ...sameDayBookings,
    ]);

    const dayIndexOf = (d: Date) =>
      dates.findIndex(
        (x) => startOfDay(x).getTime() === startOfDay(d).getTime()
      );

    const occupiedByRoom: Record<string, Set<number>> = {};
    roomTypes.forEach((t) =>
      t.rooms.forEach((r) => (occupiedByRoom[r.id] = new Set()))
    );

    allBookings.forEach((b) => {
      const ci = startOfDay(new Date(b.checkIn));
      const co = b.checkOut
        ? startOfDay(new Date(b.checkOut))
        : startOfDay(new Date(b.checkIn));

      const ciIdx = dayIndexOf(ci);
      const coIdx = dayIndexOf(co);

      if (ci.getTime() === co.getTime()) {
        if (ciIdx >= 0) occupiedByRoom[b.roomId]?.add(ciIdx);
        return;
      }

      const first = Math.max(0, ciIdx);
      const last = (coIdx >= 0 ? coIdx : dates.length) - 1;
      for (let i = first; i <= last && i < dates.length; i++) {
        if (i >= 0) occupiedByRoom[b.roomId]?.add(i);
      }
    });

    console.log("all bookings :", allBookings);

    const bookingsByRoom: Record<string, Booking[]> = {};
    allBookings.forEach((bk) => {
      (bookingsByRoom[bk.roomId] ||= []).push(bk);
    });
    Object.values(bookingsByRoom).forEach((arr) =>
      arr.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
    );

    const bookingRowMap: Record<string, number> = {};
    const rowsByRoom: Record<string, Booking[][]> = {};

    const overlaps = (a: Booking, b: Booking) => {
      const aStart = new Date(a.checkIn).getTime();
      const aEnd = a.checkOut ? new Date(a.checkOut).getTime() : aStart;

      const bStart = new Date(b.checkIn).getTime();
      const bEnd = b.checkOut ? new Date(b.checkOut).getTime() : bStart;

      return !(aEnd <= bStart || bEnd <= aStart);
    };

    for (const [roomId, bkArray] of Object.entries(bookingsByRoom)) {
      const rows: Booking[][] = [];
      bkArray.forEach((bk) => {
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
      });
      rowsByRoom[roomId] = rows;
    }

    const roomHeightMap: Record<string, number> = {};
    for (const [roomId, rows] of Object.entries(rowsByRoom)) {
      const peak = rows.length;
      const requiredHeight = peak * bookingBlockHeight + (peak - 1) * 2;
      roomHeightMap[roomId] = Math.max(rowHeight, requiredHeight);
    }

    const [statusLegend, setStatusLegend] = useState<Record<string, string>>(
      {}
    );
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
    }, [accessToken, hotelId]);

    useEffect(() => {
      if (!accessToken) return;
      api
        .get("/Reservation/status-codes")
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

    const computeBookingTop = (booking: Booking): number => {
      const domOffset = rowTopMap.current[booking.roomId];
      if (typeof domOffset === "number") {
        return domOffset;
      }

      const STATIC_HEADER_ROWS = 2;
      let offset = STATIC_HEADER_ROWS * rowHeight;

      const visibleTypes = roomTypes.filter(
        (t) => selectedRoomTypeId === "all" || t.id === selectedRoomTypeId
      );

      for (const type of visibleTypes) {
        offset += rowHeight;

        for (const r of type.rooms) {
          if (r.id === booking.roomId) {
            return offset;
          }
          offset += roomHeightMap[r.id] ?? rowHeight;
        }
      }

      return offset;
    };

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

    useEffect(() => {
      const el = containerRef.current;
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

    useEffect(() => {
      const finish = () => {
        if (!dragSel) return;

        const { roomId, startIdx, endIdx } = dragSel;
        const a = Math.min(startIdx, endIdx);
        const b = Math.max(startIdx, endIdx);

        const occ = occupiedByRoom[roomId] || new Set<number>();
        for (let i = a; i <= b; i++) {
          if (occ.has(i)) {
            setDragSel(null);
            return;
          }
        }

        const startDate = startOfDay(dates[a]);
        const endDate = startOfDay(addDays(dates[b], 1));

        const roomNumber =
          roomTypes.flatMap((t) => t.rooms).find((r) => r.id === roomId)
            ?.number ?? "";

        onSelectRange?.({
          roomId,
          roomNumber,
          roomTypeId: dragSel.roomTypeId,
          roomTypeName: dragSel.roomTypeName,
          startDate,
          endDate,
        });
        setDragSel(null);
      };

      const onUp = () => finish();

      window.addEventListener("mouseup", onUp);
      return () => window.removeEventListener("mouseup", onUp);
    }, [dragSel, dates, occupiedByRoom, onSelectRange, roomTypes]);

    const [hoveredBooking, setHoveredBooking] = useState<{
      booking: Booking;
      x: number;
      y: number;
      place: "top" | "bottom";
    } | null>(null);

    const computeTooltipPos = (e: React.MouseEvent) => {
      if (!containerRef.current)
        return { x: 0, y: 0, place: "bottom" as const };

      const rect = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

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

    const getRoomNumber = (roomId: string) =>
      roomTypes.flatMap((t) => t.rooms).find((r) => r.id === roomId)?.number ??
      "-";

    return (
      <div
        ref={containerRef}
        className="relative overflow-auto rounded-lg border border-gray-300 border-opacity-40 border-b border-b-[0.5px] w-full"
      >
        {hotelDate && (
          <div className="text-xs text-muted-foreground px-2 py-1">
            Hotel Date: {hotelDate.toLocaleDateString()}{" "}
            {hotelDate.toLocaleTimeString()}
          </div>
        )}
        <div className="relative w-full">
          <div className="overflow-hidden">
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
          <div className="max-h-[700px] overflow-y-auto no-scrollbar">
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
                            colSpan={dates.length + 1}
                            className="font-bold text-xs bg-muted/50 border  border-gray-300 border-opacity-40 border-[0.5px]"
                          >
                            {type.name}
                          </TableCell>
                        </TableRow>
                        {type.rooms.map((room) => {
                          return (
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
                                  const effectiveStatusID = getCurrentHkStatus(room.id);
                                  const isDirty = effectiveStatusID === 2;
                                  const isUpdating = !!hkUpdating[room.id];

                                  return (
                                    <div className="flex items-center gap-2">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            type="button"
                                            className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 ring-black/10 ${hkDotColor(
                                              effectiveStatusID
                                            )} ${
                                              isUpdating
                                                ? "opacity-60 cursor-wait"
                                                : "cursor-pointer"
                                            }`}
                                            title={`HK: ${hkStatusLabel(effectiveStatusID)} • Click to change`}
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
                                                handleHkChange(room, 1)
                                              }
                                              disabled={isUpdating}
                                            >
                                              Mark Clean
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleHkChange(room, 2)
                                              }
                                              disabled={isUpdating}
                                            >
                                              Mark Dirty
                                            </DropdownMenuItem>
                                          )}

                                          <DropdownMenuItem 
                                            onClick={() => handleHkChange(room, 5)} 
                                            disabled={isUpdating}
                                          >
                                            Mark WIP
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleHkChange(room, 6)} 
                                            disabled={isUpdating}
                                          >
                                            Mark Occupied Clean
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleHkChange(room, 7)} 
                                            disabled={isUpdating}
                                          >
                                            Mark Occupied Dirty
                                          </DropdownMenuItem>
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

                                const isOccupied =
                                  occupiedByRoom[room.id]?.has(di) ?? false;

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
                                        startIdx: di,
                                        endIdx: di,
                                        roomNumber: room.number,
                                        roomTypeId,
                                        roomTypeName,
                                      });
                                      e.preventDefault();
                                    }}
                                    onMouseEnter={() => {
                                      if (!dragSel) return;
                                      if (dragSel.roomId !== room.id) return;
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
                      backgroundColor: booking.statusColor || "#ccc",
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

              {dragSel &&
                (() => {
                  const start = Math.min(dragSel.startIdx, dragSel.endIdx);
                  const end = Math.max(dragSel.startIdx, dragSel.endIdx);
                  const left = fixedColWidth + start * responsiveDayColWidth;
                  const width = Math.max(
                    0,
                    (end - start + 1) * responsiveDayColWidth
                  );
                  const top = rowTopMap.current[dragSel.roomId] ?? 0;
                  const height = roomHeightMap[dragSel.roomId] ?? rowHeight;

                  return (
                    <div
                      className="pointer-events-none absolute z-[4] rounded-md border"
                      style={{
                        left,
                        top,
                        width,
                        height,
                        borderColor: "rgba(59,130,246,0.55)",
                        boxShadow: "0 0 0 2px rgba(59,130,246,0.25) inset",
                        background:
                          "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(59,130,246,0.06))",
                        transition: "left 120ms ease, width 120ms ease",
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-md"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg, rgba(59,130,246,0.18) 0 2px, transparent 2px 6px)",
                          maskImage:
                            "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
                          WebkitMaskImage:
                            "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
                        }}
                      />
                      <div
                        className="absolute inset-0 rounded-md"
                        style={{
                          border: "1px dashed rgba(59,130,246,0.7)",
                          animation: "ants 1.2s linear infinite",
                          maskImage:
                            "linear-gradient(to right, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)",
                          WebkitMaskImage:
                            "linear-gradient(to right, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)",
                        }}
                      />
                      <div
                        className="absolute -top-5 left-2 text-[11px] px-2 py-[2px] rounded-full bg-white/90 dark:bg-black/70 border border-blue-300/60 shadow-sm"
                        style={{ backdropFilter: "blur(6px)" }}
                      >
                        {format(dates[start], "MMM d")} →{" "}
                        {format(addDays(dates[end], 1), "MMM d")}
                        {" · "}
                        {dragSel.roomTypeName} — Room {dragSel.roomNumber}
                      </div>
                      <style jsx>{`
                        @keyframes ants {
                          to {
                            stroke-dashoffset: -8;
                          }
                        }
                      `}</style>
                    </div>
                  );
                })()}

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