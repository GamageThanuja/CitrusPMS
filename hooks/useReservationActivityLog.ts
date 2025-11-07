// hooks/useReservationActivityLog.ts
"use client";

import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  createReservationActivityLog,
  type ReservationActivityLogPayload,
} from "@/redux/slices/reservationActivityLogSlice";

// --- Optional selectors: adjust to your app's state shape ---
const selectCurrentHotel = (s: RootState) =>
  s.hotel?.current as ReservationActivityLogPayload["hotel"] | undefined;
const selectAuthUser = (s: RootState) =>
  s.auth?.user as { username?: string } | undefined;
const selectLogLoading = (s: RootState) =>
  s.reservationActivityLog?.loading as boolean;
const selectLogError = (s: RootState) =>
  s.reservationActivityLog?.error as string | null;

// --- Helpers ---
function getPlatform(): string {
  if (typeof navigator === "undefined") return "server";
  const p =
    (navigator as any).userAgent || (navigator as any).platform || "web";
  return `web:${p}`;
}

/**
 * Compose "createdOn" using system date (hotelDate) + current local time.
 * - If hotel.hotelDate exists (e.g., "2025-09-29"), we combine with *current* local time HH:mm:ss.
 * - Else fall back to ISO-8601.
 */
function buildCreatedOn(hotelDate?: string): string {
  const now = new Date();
  if (hotelDate) {
    // Make sure hotelDate is yyyy-MM-dd; keep as-is and append time
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${hotelDate}T${hh}:${mm}:${ss}`;
  }
  return now.toISOString();
}

/**
 * Hook to log reservation activity anywhere.
 *
 * Usage:
 * const { logReservation, logging, error } = useReservationActivityLog();
 * await logReservation({
 *   resLog: "Changed room from 201 to 305",
 *   reservationId: 123,
 *   reservationDetailId: 456,
 *   reservationNo: "RM-000123",
 *   roomNumber: "305",
 * });
 */
export function useReservationActivityLog() {
  const dispatch = useDispatch<AppDispatch>();

  const hotelFromState = useSelector(selectCurrentHotel);
  const authUser = useSelector(selectAuthUser);
  const logging = useSelector(selectLogLoading);
  const error = useSelector(selectLogError);

  // Fallbacks for when state isn't populated yet
  const hotelFallback = useMemo(() => {
    try {
      const raw = localStorage.getItem("hotelmateHotel");
      return raw
        ? (JSON.parse(raw) as ReservationActivityLogPayload["hotel"])
        : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const usernameFallback = useMemo(() => {
    try {
      const raw = localStorage.getItem("hotelmateUser");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.username as string | undefined;
    } catch {
      return undefined;
    }
  }, []);

  const hotel = hotelFromState ?? hotelFallback;

  const logReservation = useCallback(
    async (params: {
      resLog: string;
      reservationId: number;
      reservationDetailId: number;
      reservationNo?: string;
      roomNumber?: string;
      // you may override defaults if needed:
      username?: string;
      hotelId?: number;
      platform?: string;
      hotel?: ReservationActivityLogPayload["hotel"];
      createdOn?: string; // rarely needed; auto-generated otherwise
    }) => {
      const payload: ReservationActivityLogPayload = {
        username:
          params.username ?? authUser?.username ?? usernameFallback ?? "system",
        hotelId: params.hotelId ?? hotel?.hotelID ?? 0, // supply your own default if 0 is not acceptable
        reservationId: params.reservationId,
        reservationDetailId: params.reservationDetailId,
        resLog: params.resLog,
        createdOn:
          params.createdOn ??
          buildCreatedOn(hotel?.hotelDate /* system date */),
        platform: params.platform ?? getPlatform(),
        hotel: params.hotel ?? (hotel as any), // API expects a Hotel object
        reservationNo: params.reservationNo ?? "",
        roomNumber: params.roomNumber ?? "",
      };

      // You can .unwrap() if you want thrown errors
      return dispatch(createReservationActivityLog(payload)).unwrap();
    },
    [dispatch, authUser?.username, usernameFallback, hotel]
  );

  return { logReservation, logging, error };
}

export default useReservationActivityLog;
