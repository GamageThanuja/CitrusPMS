// src/redux/slices/fetchAuditMasByIdSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface AuditMasItem {
  auditID: number;
  tranDate: string;       // ISO
  module: string;
  audit: string;
  doneBy: string;
  refNo: string;
  timeStamp: string;      // ISO
  hotelCode: string;
  resNo: string;
  reservationID: number;
  // allow extra props gracefully
  [k: string]: any;
}

export interface FetchAuditMasByIdParams {
  id: number | string; // path param
}

/** ---- State ---- */
export interface AuditMasByIdState {
  loading: boolean;
  error: string | null;
  items: AuditMasItem[];
  success: boolean;
  lastQuery: FetchAuditMasByIdParams | null;
}

const initialState: AuditMasByIdState = {
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

/** ---- Thunk: GET /api/AuditMas/{id} ---- */
export const fetchAuditMasById = createAsyncThunk<
  AuditMasItem[],
  FetchAuditMasByIdParams,
  { rejectValue: string }
>("auditMasById/fetch", async ({ id }, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/AuditMas/${encodeURIComponent(
      String(id)
    )}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch AuditMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchAuditMasByIdSlice = createSlice({
  name: "auditMasById",
  initialState,
  reducers: {
    clearAuditMasById(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditMasById.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(
        fetchAuditMasById.fulfilled,
        (state, action: PayloadAction<AuditMasItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchAuditMasById.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to fetch AuditMas.";
      });
  },
});

export const { clearAuditMasById } = fetchAuditMasByIdSlice.actions;
export default fetchAuditMasByIdSlice.reducer;

/** ---- Selectors ---- */
export const selectAuditMasByIdItems = (s: any) =>
  (s.auditMasById?.items as AuditMasItem[]) ?? [];
export const selectAuditMasByIdLoading = (s: any) =>
  (s.auditMasById?.loading as boolean) ?? false;
export const selectAuditMasByIdError = (s: any) =>
  (s.auditMasById?.error as string | null) ?? null;
export const selectAuditMasByIdSuccess = (s: any) =>
  (s.auditMasById?.success as boolean) ?? false;