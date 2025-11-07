// hooks/useHotelLogo.ts
"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchHotelByGuid,
  selectHotelByGuid,
} from "@/redux/slices/fetchHotelByGuidSlice";

function getSignedExpiryMs(url?: string): number | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const amzDate = u.searchParams.get("X-Amz-Date");
    const amzExpires = u.searchParams.get("X-Amz-Expires");
    if (!amzDate || !amzExpires) return null;

    const y = +amzDate.slice(0, 4);
    const m = +amzDate.slice(4, 6);
    const d = +amzDate.slice(6, 8);
    const hh = +amzDate.slice(9, 11);
    const mm = +amzDate.slice(11, 13);
    const ss = +amzDate.slice(13, 15);
    const issuedAt = Date.UTC(y, m - 1, d, hh, mm, ss);
    const expiresAt = issuedAt + Number(amzExpires) * 1000;
    return Math.max(expiresAt - Date.now(), 0);
  } catch {
    return null;
  }
}

export const useHotelLogo = () => {
  const dispatch = useAppDispatch();
  const { data, status, error } = useAppSelector(selectHotelByGuid);

  useEffect(() => {
    if (status === "idle") dispatch(fetchHotelByGuid());
  }, [status, dispatch]);

  const refresh = useCallback(() => {
    dispatch(fetchHotelByGuid());
  }, [dispatch]);

  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const msLeft = getSignedExpiryMs(data?.logoURL);
    if (msLeft && msLeft > 0) {
      const fireIn = Math.max(msLeft - 2 * 60 * 1000, 5 * 1000);
      timerRef.current = window.setTimeout(refresh, fireIn);
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [data?.logoURL, refresh]);

  // No fallback: return null if absent
  const logoUrl = useMemo(() => data?.logoURL ?? null, [data?.logoURL]);

  return {
    logoUrl, // string | null
    hotel: data,
    loading: status === "loading" || status === "idle",
    error,
    refresh,
  };
};
