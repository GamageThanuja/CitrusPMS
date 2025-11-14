// src/redux/slices/fetchBasisMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface BasisMasItem {
  basisID: number;
  basis: string;
  cmRateID: string;
  showOnIBE: boolean;
  descOnIBE: string;
  // allow extra props gracefully
  [k: string]: any;
}

export interface FetchBasisMasParams {
  basis?: string;
}

/** ---- State ---- */
export interface FetchBasisMasState {
  loading: boolean;
  error: string | null;
  items: BasisMasItem[];
  success: boolean;
  lastFetchedAt: string | null; // ISO timestamp of last success
}

const initialState: FetchBasisMasState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

function normalizeArray(res: any): BasisMasItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as BasisMasItem[];
  if (typeof res === "object") return [res as BasisMasItem];
  return [];
}

/** ---- Thunk: GET /api/BasisMas ---- */
export const fetchBasisMas = createAsyncThunk<
  BasisMasItem[],
  FetchBasisMasParams | undefined,
  { rejectValue: string }
>("basisMas/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const basis = params?.basis;
    const url = `${API_BASE_URL}/api/BasisMas${basis ? `?basis=${encodeURIComponent(basis)}` : ""}`;
    console.log("Fetching meal plans from:", url);
    const res = await axios.get(url);
    console.log("BasisMas API response:", res.data);
    const normalizedData = normalizeArray(res.data);
    console.log("Normalized BasisMas data:", normalizedData);
    return normalizedData;
  } catch (err: any) {
    console.error("BasisMas API error:", err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch BasisMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchBasisMasSlice = createSlice({
  name: "basisMas",
  initialState,
  reducers: {
    clearBasisMas(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBasisMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchBasisMas.fulfilled,
        (state, action: PayloadAction<BasisMasItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchBasisMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch BasisMas.";
      });
  },
});

export const { clearBasisMas } = fetchBasisMasSlice.actions;
export default fetchBasisMasSlice.reducer;

/** ---- Selectors ---- */
export const selectBasisMasItems = (s: any) =>
  (s.fetchBasisMas?.items as BasisMasItem[]) ?? [];
export const selectBasisMasLoading = (s: any) =>
  (s.fetchBasisMas?.loading as boolean) ?? false;
export const selectBasisMasError = (s: any) =>
  (s.fetchBasisMas?.error as string | null) ?? null;
export const selectBasisMasSuccess = (s: any) =>
  (s.fetchBasisMas?.success as boolean) ?? false;
export const selectBasisMasLastFetchedAt = (s: any) =>
  (s.fetchBasisMas?.lastFetchedAt as string | null) ?? null;