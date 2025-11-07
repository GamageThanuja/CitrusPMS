

// src/redux/slices/fetchCurrencyMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface CurrencyMasItem {
  currencyID: number;
  finAct: boolean;
  currencyCode: string;
  currencyName: string;
  isHome: boolean;
  conversionRate: number;
  effectFrom: string; // ISO
  effectTo: string; // ISO
  updatedBy: string;
  createdOn: string; // ISO
  buid: number;
  accountCode: string;
  lastUpdatedOn: string; // ISO
  buyingRate: number;
  // allow extra props gracefully
  [k: string]: any;
}

/** ---- State ---- */
export interface FetchCurrencyMasState {
  loading: boolean;
  error: string | null;
  items: CurrencyMasItem[];
  success: boolean;
}

const initialState: FetchCurrencyMasState = {
  loading: false,
  error: null,
  items: [],
  success: false,
};

function normalizeArray(res: any): CurrencyMasItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as CurrencyMasItem[];
  if (typeof res === "object") return [res as CurrencyMasItem];
  return [];
}

/** ---- Thunk: GET /api/CurrencyMas ---- */
export interface FetchCurrencyMasParams {
  currencyCode?: string;
}

export const fetchCurrencyMas = createAsyncThunk<
  CurrencyMasItem[],
  FetchCurrencyMasParams | undefined,
  { rejectValue: string }
>("currencyMas/fetchAll", async (params: FetchCurrencyMasParams = {} as FetchCurrencyMasParams, { rejectWithValue }) => {
  try {
    const { currencyCode } = params;
    const query = new URLSearchParams();
    if (currencyCode) query.append("currencyCode", currencyCode);

    const url = `${API_BASE_URL}/api/CurrencyMas${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch CurrencyMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchCurrencyMasSlice = createSlice({
  name: "currencyMas",
  initialState,
  reducers: {
    clearCurrencyMas(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencyMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchCurrencyMas.fulfilled,
        (state, action: PayloadAction<CurrencyMasItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchCurrencyMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch CurrencyMas.";
      });
  },
});

export const { clearCurrencyMas } = fetchCurrencyMasSlice.actions;
export default fetchCurrencyMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCurrencyMasItems = (s: any) =>
  (s.fetchCurrencyMas?.items as CurrencyMasItem[]) ?? [];

export const selectCurrencyMasLoading = (s: any) =>
  (s.fetchCurrencyMas?.loading as boolean) ?? false;

export const selectCurrencyMasError = (s: any) =>
  (s.fetchCurrencyMas?.error as string | null) ?? null;

export const selectCurrencyMasSuccess = (s: any) =>
  (s.fetchCurrencyMas?.success as boolean) ?? false;