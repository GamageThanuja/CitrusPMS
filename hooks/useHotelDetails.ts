// hooks/useHotelDetails.ts
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  fetchHotelByGuid,
  selectHotelByGuid,
  type Hotel,
} from "@/redux/slices/fetchHotelByGuidSlice";

/* Helper: read selected property's GUID from localStorage safely */
function readSelectedGuid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("selectedProperty");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.guid ?? null;
  } catch {
    return null;
  }
}

type Options = {
  /** auto-fetch on mount & when selectedProperty changes (default: true) */
  auto?: boolean;
};

export function useHotelDetails(options: Options = { auto: true }) {
  const dispatch = useDispatch<AppDispatch>();
  const { data, status, error } = useSelector(selectHotelByGuid);

  const guidRef = useRef<string | null>(null);

  // Kick off a fetch when:
  // - auto=true
  // - we have a GUID
  // - and slice is idle/failed OR data is missing
  const ensureFetched = useCallback(() => {
    const guid = readSelectedGuid();
    guidRef.current = guid;
    if (!options.auto || !guid) return;

    const needsFetch =
      status === "idle" || status === "failed" || !data?.hotelGUID;

    if (needsFetch) {
      dispatch(fetchHotelByGuid());
    }
  }, [dispatch, options.auto, status, data?.hotelGUID]);

  // On mount
  useEffect(() => {
    ensureFetched();
    // Also refetch when the tab regains focus (property might have changed elsewhere)
    const onFocus = () => ensureFetched();
    // Listen to storage updates from other tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (e.key === "selectedProperty") ensureFetched();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [ensureFetched]);

  const refresh = useCallback(() => {
    dispatch(fetchHotelByGuid());
  }, [dispatch]);

  const derived = useMemo(() => {
    const hotel: Hotel | null = data ?? null;
    const loading = status === "loading";
    const succeeded = status === "succeeded";
    const failed = status === "failed";

    // Niceties you can use straight in UI
    const name = hotel?.hotelName ?? "";
    const code = hotel?.hotelCode ?? null;
    const currency = hotel?.currencyCode ?? "";
    const cmActive = !!hotel?.isCMActive;
    const ibeActive = !!hotel?.isIBEActive;
    const logo = hotel?.logoURL || null;
    const slug = hotel?.slug || null;
    const hotelCountry = hotel?.country || null;

    const hotelDate = hotel?.hotelDate ? new Date(hotel.hotelDate) : null;

    const hasSelectedProperty = !!guidRef.current;

    return {
      hotel,
      loading,
      succeeded,
      failed,
      error,
      name,
      code,
      currency,
      cmActive,
      ibeActive,
      logo,
      slug,
      hotelDate,
      hasSelectedProperty,
      hotelCountry,
    };
  }, [data, status, error]);

  return {
    ...derived,
    refresh,
  };
}
