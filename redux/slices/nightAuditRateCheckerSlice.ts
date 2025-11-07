// redux/slices/nightAuditRateCheckerSlice.ts
"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

/** One record from /api/NightAudit/RateChecker */
export interface RateCheckRecord {
  recordId: number;
  hotelId: number;
  reservationId: number;
  reservationDetailId: number;
  rateDate: string; // ISO date-time
  mealPlan: string | null;
  roomRate: number;
  discPercen: number;
  discount: number;
  childRate: number;
  exBedRate: number;
  suppliment: number;
  isFOC: boolean;
  netRate: number;
  currencyCode: string | null;
  exchangeRate: number;
  adult: number;
  child: number;
  isChecked: boolean;
  checkedBy: string | null;
  checkedAt: string | null; // ISO date-time
  guestName: string | null;
  exBed: boolean;
  exBedCount: number;
  roomCount: number;
  isLocked: boolean;
  isNightAudit: boolean;
  updatedOn: string | null; // ISO date-time
  updatedBy: string | null;
  finAct: boolean;
}

export type RateCheckerParams = {
  /** Required; if omitted, we try to read from localStorage.selectedProperty.id */
  hotelId?: number;
  /** Optional */
  reservationStatusId?: number;
  /** Optional ISO date-time string, e.g. new Date().toISOString() */
  rateDate?: string;
};

type State = {
  data: RateCheckRecord[];
  loading: boolean;
  error: string | null;
  /** The last parameters used in a successful/attempted fetch (handy for UI) */
  lastParams:
    | (Required<Pick<RateCheckerParams, "hotelId">> &
        Partial<Omit<RateCheckerParams, "hotelId">>)
    | null;
};

const initialState: State = {
  data: [],
  loading: false,
  error: null,
  lastParams: null,
};

/**
 * Helper to read tokens & selected property the same way you do elsewhere
 */
function getAuthAndHotelId(overrides?: RateCheckerParams): {
  accessToken: string | null;
  hotelId: number;
} {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | null = parsedToken?.accessToken ?? null;

  let hotelId: number | undefined = overrides?.hotelId;
  if (!hotelId) {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    hotelId = property?.id;
  }

  if (!hotelId) {
    throw new Error(
      "A valid hotelId is required (none found in localStorage or params)."
    );
  }

  return { accessToken, hotelId };
}

/**
 * Builds the query string from params
 */
function buildQuery(params: RateCheckerParams & { hotelId: number }): string {
  const qs = new URLSearchParams();
  qs.set("hotelId", String(params.hotelId));
  if (
    params.reservationStatusId !== undefined &&
    params.reservationStatusId !== null
  ) {
    qs.set("reservationStatusId", String(params.reservationStatusId));
  }
  if (params.rateDate) {
    qs.set("rateDate", params.rateDate);
  }
  return qs.toString();
}

/**
 * If you already use an env var for your API base, reuse it here.
 * Fallback keeps it flexible in local dev.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Thunk: fetch rate checker rows
 */
export const fetchNightAuditRateChecks = createAsyncThunk<
  RateCheckRecord[],
  RateCheckerParams | void,
  { rejectValue: string }
>("nightAuditRateChecker/fetch", async (params, { rejectWithValue }) => {
  try {
    const { accessToken, hotelId } = getAuthAndHotelId(params ?? {});
    const query = buildQuery({ hotelId, ...params });

    const res = await fetch(`${API_BASE}/api/NightAudit/RateChecker?${query}`, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain;q=0.9",
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return rejectWithValue(
        `Error ${res.status}: ${res.statusText || "Request failed"}${
          text ? ` — ${text}` : ""
        }`
      );
    }

    // Some backends advertise text/plain but still return JSON.
    // Try JSON first, fallback to text->JSON parse.
    let payload: any;
    try {
      payload = await res.json();
    } catch {
      const t = await res.text();
      payload = t ? JSON.parse(t) : [];
    }

    return Array.isArray(payload) ? (payload as RateCheckRecord[]) : [];
  } catch (err: any) {
    return rejectWithValue(err?.message ?? "Unknown error");
  }
});

const slice = createSlice({
  name: "nightAuditRateChecker",
  initialState,
  reducers: {
    clearNightAuditRateChecks(state) {
      state.data = [];
      state.error = null;
      state.lastParams = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNightAuditRateChecks.pending, (state, action) => {
        state.loading = true;
        state.error = null;

        // Capture last requested params (after hotelId resolution)
        try {
          const incoming = (action.meta.arg ?? {}) as RateCheckerParams;
          const { hotelId } = getAuthAndHotelId(incoming);
          state.lastParams = { hotelId, ...incoming };
        } catch {
          // ignore here; will surface error in rejected
        }
      })
      .addCase(
        fetchNightAuditRateChecks.fulfilled,
        (state, action: PayloadAction<RateCheckRecord[]>) => {
          state.loading = false;
          state.data = action.payload ?? [];
        }
      )
      .addCase(fetchNightAuditRateChecks.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch rate checks";
      });
  },
});

export const { clearNightAuditRateChecks } = slice.actions;
export default slice.reducer;

/** Selectors */
export const selectRateChecks = (s: RootState) => s.nightAuditRateChecker.data;
export const selectRateChecksLoading = (s: RootState) =>
  s.nightAuditRateChecker.loading;
export const selectRateChecksError = (s: RootState) =>
  s.nightAuditRateChecker.error;
export const selectRateChecksLastParams = (s: RootState) =>
  s.nightAuditRateChecker.lastParams;
