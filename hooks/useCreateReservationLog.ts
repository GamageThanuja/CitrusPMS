// hooks/useCreateReservationLog.ts
"use client";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import type { RootState } from "@/redux/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ReservationLogPayload {
  logId?: number;
  username: string;
  hotelId?: number;
  reservationId: number;
  reservationDetailId: number;
  resLog: string;
  createdOn?: string; // optional; will be auto-filled if omitted
  platform: string;
  reservationNo?: string;
  roomNumber?: string;
  hotel?: any;
}

/** Combine a given calendar date (e.g. systemDate) with the current local time, return ISO (UTC). */
function combineDateWithNowISO(dateLike: string | Date): string {
  // If dateLike is "YYYY-MM-DD" or an ISO string, this still works.
  const base = new Date(dateLike);
  const now = new Date();

  const combinedLocal = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
  return combinedLocal.toISOString(); // send UTC ISO to API
}

export const useCreateReservationLog = () => {
  const dispatch = useAppDispatch();

  // Kick off system date fetch on first use of the hook.
  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  // Read system date slice
  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );
  const systemDateLoading = useAppSelector(
    (state: RootState) => state.systemDate.status === "loading"
  );
  const systemDateError = useAppSelector(
    (state: RootState) => state.systemDate.error as string | null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const createLog = useCallback(
    async (payload: ReservationLogPayload) => {
      setLoading(true);
      setError(null);

      try {
        const storedToken = localStorage.getItem("hotelmateTokens");
        const parsedToken = storedToken ? JSON.parse(storedToken) : null;
        const accessToken = parsedToken?.accessToken;
        if (!accessToken) throw new Error("No access token found");

        const selectedProperty = localStorage.getItem("selectedProperty");
        const property = selectedProperty ? JSON.parse(selectedProperty) : {};
        const hotelId = payload.hotelId || property.id;
        if (!hotelId) throw new Error("Hotel ID not found");

        // Prefer explicit payload.createdOn; else try systemDate+now; else now.
        let createdOnISO: string;
        if (payload.createdOn) {
          createdOnISO = new Date(payload.createdOn).toISOString();
        } else if (systemDate && !systemDateLoading && !systemDateError) {
          createdOnISO = combineDateWithNowISO(systemDate);
        } else {
          createdOnISO = new Date().toISOString();
        }

        const finalPayload = {
          logId: payload.logId ?? 0,
          username: payload.username,
          hotelId,
          reservationId: payload.reservationId,
          reservationDetailId: payload.reservationDetailId,
          resLog: payload.resLog,
          createdOn: createdOnISO,
          platform: payload.platform || "Web",
          reservationNo: payload.reservationNo || "",
          roomNumber: payload.roomNumber || "",
          hotel: payload.hotel ?? undefined,
        };

        const res = await axios.post(
          `${BASE_URL}/api/ReservationActivityLog`,
          finalPayload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        setResponse(res.data);
        return res.data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail || err.message || "Request failed";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [systemDate, systemDateLoading, systemDateError]
  );

  return { createLog, loading, error, response, systemDate, systemDateLoading };
};
