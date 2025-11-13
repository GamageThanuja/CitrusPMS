// src/redux/slices/fetchRateMasAvailabilitySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface RateMasAvailabilityItem {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string;            // "YYYY-MM-DD"
  defaultRate: number;
  pax1: number;  pax2: number;  pax3: number;  pax4: number;  pax5: number;
  pax6: number;  pax7: number;  pax8: number;  pax9: number;  pax10: number;
  pax11: number; pax12: number; pax13: number; pax14: number; pax15: number;
  pax16: number; pax17: number; pax18: number;
  child: number;
  dateFrom: string;            // ISO
  dateTo: string;              // ISO
  sellMode: string;
  rateMode: string;
  roomTypeID: number;
  primaryOccupancy: number;
  increaseBy: number;
  decreaseBy: number;
  [k: string]: any;
}

/** ---- Query Params ---- */

export interface FetchRateMasAvailabilityParams {
  hotelId: number;               // path param (required)
  startDate?: string;            // "MM-dd-yyyy"
  endDate?: string;              // "MM-dd-yyyy"
  rateCodeId?: number;           // from RateCodes
  search?: string;
  currencyCode?: string;
  hotelCode?: string;            // from selectedProperty.hotelCode
}
/** ---- State ---- */
export interface FetchRateMasAvailabilityState {
  loading: boolean;
  error: string | null;
  items: RateMasAvailabilityItem[];
  success: boolean;
  lastFetchedAt: string | null;
}

const initialState: FetchRateMasAvailabilityState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

/** ---- Thunk: GET /api/RateMas/availability/{hotelId} ---- */
export const fetchRateMasAvailability = createAsyncThunk<
  RateMasAvailabilityItem[],
  FetchRateMasAvailabilityParams,
  { rejectValue: string }
>("rateMasAvailability/fetch", async (params, { rejectWithValue }) => {
  try {
    const { hotelId, startDate, endDate, rateCodeId, search, currencyCode, hotelCode } = params;
    const url = new URL(`${API_BASE_URL}/api/RateMas/availability/${encodeURIComponent(String(hotelId))}`);
    if (startDate)   url.searchParams.append("startDate", startDate);
    if (endDate)     url.searchParams.append("endDate", endDate);
    if (rateCodeId !== undefined) url.searchParams.append("rateCodeId", String(rateCodeId));
    if (search)      url.searchParams.append("search", search);
    if (currencyCode)url.searchParams.append("currencyCode", currencyCode);
    if (hotelCode)   url.searchParams.append("hotelCode", hotelCode);

    const res = await axios.get(url.toString());
    const data = res.data;

    // Coerce to array—API may return one record or many
    if (Array.isArray(data)) return data as RateMasAvailabilityItem[];
    if (data && typeof data === "object") return [data as RateMasAvailabilityItem];
    return [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch RateMas availability.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchRateMasAvailabilitySlice = createSlice({
  name: "fetchRateMasAvailability",
  initialState,
  reducers: {
    clearFetchRateMasAvailability(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRateMasAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchRateMasAvailability.fulfilled,
        (state, action: PayloadAction<RateMasAvailabilityItem[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchRateMasAvailability.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch RateMas availability.";
      });
  },
});

export const { clearFetchRateMasAvailability } =
  fetchRateMasAvailabilitySlice.actions;
export default fetchRateMasAvailabilitySlice.reducer;

/** ---- Selectors ---- */
export const selectRateMasAvailabilityItems = (s: any) =>
  (s.fetchRateMasAvailability?.items as RateMasAvailabilityItem[]) ?? [];
export const selectRateMasAvailabilityLoading = (s: any) =>
  (s.fetchRateMasAvailability?.loading as boolean) ?? false;
export const selectRateMasAvailabilityError = (s: any) =>
  (s.fetchRateMasAvailability?.error as string | null) ?? null;
export const selectRateMasAvailabilitySuccess = (s: any) =>
  (s.fetchRateMasAvailability?.success as boolean) ?? false;
export const selectRateMasAvailabilityLastFetchedAt = (s: any) =>
  (s.fetchRateMasAvailability?.lastFetchedAt as string | null) ?? null;