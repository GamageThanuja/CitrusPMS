// src/redux/slices/fetchRateMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface RateMasItem {
  rateID: number;
  finAct: boolean | null;
  rateCodeID: string;          // API returns string in sample
  dateFrom: string;            // ISO
  dateTo: string;              // ISO
  createdOn: string;
  createdBy: string;
  lastModBy: string | null;
  lastModOn: string | null;
  roomTypeID: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  ai: number;
  seasonID: number;
  marketID: number;
  isGuideRate: boolean | null;
  currencyCode: string;
  isDriverRate: boolean | null;
  supp24: number;
  supp31: number;
  reqPaidNights: number | null;
  eligibleFreeNights: number | null;
  rateType: string;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
  dateText: string;
  [k: string]: any;
}

/** ---- Optional query params (all optional) ---- */
export interface FetchRateMasParams {
  rateCodeId?: number | string;
  roomTypeID?: number;
  seasonID?: number;
  marketID?: number;
  currencyCode?: string;
  startDate?: string;   // ISO yyyy-mm-dd
  endDate?: string;     // ISO yyyy-mm-dd
  hotelCode?: string;
  search?: string;
}

/** ---- State ---- */
interface FetchRateMasState {
  loading: boolean;
  error: string | null;
  items: RateMasItem[];
  success: boolean;
  lastFetchedAt: string | null;
}

const initialState: FetchRateMasState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

/** ---- Thunk: GET /api/RateMas ---- */
export const fetchRateMas = createAsyncThunk<
  RateMasItem[],
  FetchRateMasParams | void,
  { rejectValue: string }
>("rateMas/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const url = new URL(`${API_BASE_URL}/api/RateMas`);
    // attach only provided params
    const add = (k: string, v?: any) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, String(v));
    };
    add("rateCodeId", (params as FetchRateMasParams).rateCodeId);
    add("roomTypeID", (params as FetchRateMasParams).roomTypeID);
    add("seasonID", (params as FetchRateMasParams).seasonID);
    add("marketID", (params as FetchRateMasParams).marketID);
    add("currencyCode", (params as FetchRateMasParams).currencyCode);
    add("startDate", (params as FetchRateMasParams).startDate);
    add("endDate", (params as FetchRateMasParams).endDate);
    add("hotelCode", (params as FetchRateMasParams).hotelCode);
    add("search", (params as FetchRateMasParams).search);

    const res = await axios.get(url.toString());
    return Array.isArray(res.data) ? (res.data as RateMasItem[]) : [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch RateMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchRateMasSlice = createSlice({
  name: "fetchRateMas",
  initialState,
  reducers: {
    clearFetchRateMas(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRateMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchRateMas.fulfilled,
        (state, action: PayloadAction<RateMasItem[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchRateMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to fetch RateMas.";
      });
  },
});

export const { clearFetchRateMas } = fetchRateMasSlice.actions;
export default fetchRateMasSlice.reducer;

/** ---- Selectors ---- */
export const selectRateMasItems = (s: any) =>
  (s.fetchRateMas?.items as RateMasItem[]) ?? [];
export const selectRateMasLoading = (s: any) =>
  (s.fetchRateMas?.loading as boolean) ?? false;
export const selectRateMasError = (s: any) =>
  (s.fetchRateMas?.error as string | null) ?? null;
export const selectRateMasSuccess = (s: any) =>
  (s.fetchRateMas?.success as boolean) ?? false;
export const selectRateMasLastFetchedAt = (s: any) =>
  (s.fetchRateMas?.lastFetchedAt as string | null) ?? null;