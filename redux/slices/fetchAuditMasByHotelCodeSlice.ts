// src/redux/slices/fetchAuditMasByHotelCodeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface AuditMasItem {
  auditID: number;
  tranDate: string; // ISO
  module: string;
  audit: string;
  doneBy: string;
  refNo: string;
  timeStamp: string; // ISO
  hotelCode: string;
  resNo: string;
  reservationID: number;
  // allow extra props gracefully
  [k: string]: any;
}

export interface FetchAuditMasByHotelCodeParams {
  hotelCode: string; // path param
  pageNumber?: number;
  pageSize?: number;
}

/** ---- State ---- */
export interface AuditMasByHotelCodeState {
  loading: boolean;
  error: string | null;
  items: AuditMasItem[];
  success: boolean;
  lastQuery: FetchAuditMasByHotelCodeParams | null;
}

const initialState: AuditMasByHotelCodeState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastQuery: null,
};

function normalizeArray(res: any): AuditMasItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as AuditMasItem[];
  if (typeof res === "object") return [res as AuditMasItem];
  return [];
}

/** ---- Thunk: GET /api/AuditMas/by-hotel/{hotelCode} ---- */
export const fetchAuditMasByHotelCode = createAsyncThunk<
  AuditMasItem[],
  FetchAuditMasByHotelCodeParams,
  { rejectValue: string }
>("auditMasByHotelCode/fetch", async ({ hotelCode, pageNumber, pageSize }, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/AuditMas/by-hotel/${encodeURIComponent(
      String(hotelCode)
    )}?pageNumber=${pageNumber ?? 1}&pageSize=${pageSize ?? 50}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch AuditMas by hotel code.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchAuditMasByHotelCodeSlice = createSlice({
  name: "auditMasByHotelCode",
  initialState,
  reducers: {
    clearAuditMasByHotelCode(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditMasByHotelCode.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(
        fetchAuditMasByHotelCode.fulfilled,
        (state, action: PayloadAction<AuditMasItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchAuditMasByHotelCode.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch AuditMas by hotel code.";
      });
  },
});

export const { clearAuditMasByHotelCode } =
  fetchAuditMasByHotelCodeSlice.actions;
export default fetchAuditMasByHotelCodeSlice.reducer;

/** ---- Selectors ---- */
export const selectAuditMasByHotelCodeItems = (s: any) =>
  (s.fetchAuditMasByHotelCode?.items as AuditMasItem[]) ?? [];
export const selectAuditMasByHotelCodeLoading = (s: any) =>
  (s.fetchAuditMasByHotelCode?.loading as boolean) ?? false;
export const selectAuditMasByHotelCodeError = (s: any) =>
  (s.fetchAuditMasByHotelCode?.error as string | null) ?? null;
export const selectAuditMasByHotelCodeSuccess = (s: any) =>
  (s.fetchAuditMasByHotelCode?.success as boolean) ?? false;
export const selectAuditMasByHotelCodeLastQuery = (s: any) =>
  (s.fetchAuditMasByHotelCode?.lastQuery as FetchAuditMasByHotelCodeParams | null) ??
  null;