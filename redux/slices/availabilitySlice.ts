import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** API shape (1 item). Server may return an array of these across a range. */
export interface RateAvailability {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string; // "2025-08-13"
  defaultRate: number;
  pax1: number;
  pax2: number;
  pax3: number;
  pax4: number;
  pax5: number;
  pax6: number;
  pax7: number;
  pax8: number;
  pax9: number;
  pax10: number;
  pax11: number;
  pax12: number;
  pax13: number;
  pax14: number;
  pax15: number;
  pax16: number;
  pax17: number;
  pax18: number;
  child: number;
  dateFrom: string; // ISO
  dateTo: string; // ISO
  sellMode: string;
  rateMode: string;
  roomTypeID: number;
  primaryOccupancy: number;
  increaseBy: number;
  decreaseBy: number;
}

export type FetchAvailabilityArgs = {
  /** Accepts Date or ISO string; will be normalized to ISO. */
  startDate: Date | string;
  endDate: Date | string;
  rateCodeId?: number;
  /** Optional free-text search if you expose it in UI */
  search?: string;
};

interface RateAvailabilityState {
  data: RateAvailability[];
  loading: boolean;
  error: string | null;
  lastParams: {
    startDate?: string;
    endDate?: string;
    rateCodeId?: number;
    search?: string;
  } | null;
}

const initialState: RateAvailabilityState = {
  data: [],
  loading: false,
  error: null,
  lastParams: null,
};

function toIso(d: Date | string) {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

/**
 * Fetch hotel rate availability
 * - Reads accessToken and hotelId from localStorage as requested
 * - startDate/endDate/rateCodeId/search come from the page
 */
export const fetchRateAvailability = createAsyncThunk<
  RateAvailability[], // return type
  FetchAvailabilityArgs, // arg type
  { rejectValue: string } // error payload
>("rateAvailability/fetch", async (params, { rejectWithValue }) => {
  try {
    // --- tokens & hotel from localStorage (as per your instructions)
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;

    if (!BASE_URL) return rejectWithValue("API base URL is not configured.");
    if (!accessToken)
      return rejectWithValue("No access token found in localStorage.");
    if (!hotelId)
      return rejectWithValue(
        "No hotelId (selectedProperty.id) found in localStorage."
      );

    const startISO = toIso(params.startDate);
    const endISO = toIso(params.endDate);

    const searchParams = new URLSearchParams();
    searchParams.set("startDate", startISO);
    searchParams.set("endDate", endISO);
    if (typeof params.rateCodeId === "number") {
      searchParams.set("rateCodeId", String(params.rateCodeId));
    }
    if (params.search) {
      searchParams.set("search", params.search);
    }

    const url = `${BASE_URL}/api/HotelRatePlans/availability/${hotelId}?${searchParams.toString()}`;

    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, text/plain",
      },
    });

    // API may return either a single object or an array — normalize to array
    const normalized: RateAvailability[] = Array.isArray(data)
      ? data
      : data
      ? [data]
      : [];

    return normalized;
  } catch (err: any) {
    // Prefer server ProblemDetails if available
    const problem = err?.response?.data;
    const msg =
      problem?.detail ||
      problem?.title ||
      err?.response?.statusText ||
      err?.message ||
      "Failed to fetch rate availability.";
    return rejectWithValue(msg);
  }
});

const rateAvailabilitySlice = createSlice({
  name: "rateAvailability",
  initialState,
  reducers: {
    clearRateAvailability(state) {
      state.data = [];
      state.error = null;
      state.lastParams = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRateAvailability.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        // store last requested params (nice for refresh/retry buttons)
        const { startDate, endDate, rateCodeId, search } = action.meta.arg;
        state.lastParams = {
          startDate: toIso(startDate),
          endDate: toIso(endDate),
          rateCodeId,
          search,
        };
      })
      .addCase(
        fetchRateAvailability.fulfilled,
        (state, action: PayloadAction<RateAvailability[]>) => {
          state.loading = false;
          state.data = action.payload ?? [];
        }
      )
      .addCase(fetchRateAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Request failed.";
      });
  },
});

export const { clearRateAvailability } = rateAvailabilitySlice.actions;
export default rateAvailabilitySlice.reducer;

/** Selectors */
export const selectRateAvailability = (s: any) =>
  s.rateAvailability as RateAvailabilityState;
export const selectRateAvailabilityByDate = (s: any) => {
  const state = s.rateAvailability as RateAvailabilityState;
  const map = new Map<string, RateAvailability[]>();
  state.data.forEach((item) => {
    const key = item.rateDate; // "YYYY-MM-DD"
    const arr = map.get(key) ?? [];
    arr.push(item);
    map.set(key, arr);
  });
  return map;
};
