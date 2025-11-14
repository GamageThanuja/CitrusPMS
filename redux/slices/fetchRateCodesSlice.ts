// src/redux/slices/fetchRateCodesSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface RateCodeItem {
  rateCodeID: number;
  finAct: boolean;
  rateCode: string;
  description: string;
  createdOn: string;           // ISO
  createdBy: string;
  lastModBy: string | null;
  hotelCode: string;
  notes: string;
  exchangeType: string;        // e.g. "Fixed at Reservation"
  isTaxIncluded: boolean;
  underYearsFOC: number;
  underYearsCharged: number;
  underYearsChargedPercentage: number;
  isNegotiable: boolean;
  isShowOnFO: boolean;
  isLocked: boolean;
  doNotSeperateTaxes: boolean;
  [k: string]: any;
}

/** ---- State ---- */
export interface FetchRateCodesState {
  loading: boolean;
  error: string | null;
  items: RateCodeItem[];
  success: boolean;
  lastFetchedAt: string | null;
}

const initialState: FetchRateCodesState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

/** ---- Thunk: GET /api/RateCodes ---- */
export const fetchRateCodes = createAsyncThunk<
  RateCodeItem[],
  void,
  { rejectValue: string }
>("rateCodes/fetch", async (_arg, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/RateCodes`;
    const res = await axios.get(url);

    // Coerce to array safely (API may return single object or array)
    const data = res.data;
    if (Array.isArray(data)) return data as RateCodeItem[];
    if (data && typeof data === "object") return [data as RateCodeItem];
    return [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch Rate Codes.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchRateCodesSlice = createSlice({
  name: "fetchRateCodes",
  initialState,
  reducers: {
    clearFetchRateCodes(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRateCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchRateCodes.fulfilled,
        (state, action: PayloadAction<RateCodeItem[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchRateCodes.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to fetch Rate Codes.";
      });
  },
});

export const { clearFetchRateCodes } = fetchRateCodesSlice.actions;
export default fetchRateCodesSlice.reducer;

/** ---- Selectors ---- */
export const selectRateCodes = (s: any) =>
  (s.fetchRateCodes?.items as RateCodeItem[]) ?? [];
export const selectRateCodesLoading = (s: any) =>
  (s.fetchRateCodes?.loading as boolean) ?? false;
export const selectRateCodesError = (s: any) =>
  (s.fetchRateCodes?.error as string | null) ?? null;
export const selectRateCodesSuccess = (s: any) =>
  (s.fetchRateCodes?.success as boolean) ?? false;
export const selectRateCodesLastFetchedAt = (s: any) =>
  (s.fetchRateCodes?.lastFetchedAt as string | null) ?? null;