// src/redux/slices/fetchCountryMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CountryMasItem {
  countryID: number;
  country: string;
  countryCode: string;
}

export interface FetchCountryMasState {
  loading: boolean;
  error: string | null;
  data: CountryMasItem[];
  success: boolean;
}

const initialState: FetchCountryMasState = {
  loading: false,
  error: null,
  data: [],
  success: false,
};

/** ---- Thunk: GET /api/CountryMas?country=&countryCode= ---- */
export interface FetchCountryMasParams {
  country?: string;
  countryCode?: string;
}

export const fetchCountryMas = createAsyncThunk<
  CountryMasItem[],
  FetchCountryMasParams | void,
  { rejectValue: string }
>("countryMas/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const { country, countryCode } = (params || {}) as FetchCountryMasParams;
    const url = `${API_BASE_URL}/api/CountryMas`;
    const res = await axios.get(url, {
      params: {
        ...(country ? { country } : {}),
        ...(countryCode ? { countryCode } : {}),
      },
    });

    const payload = Array.isArray(res.data) ? res.data : [];
    return payload as CountryMasItem[];
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to fetch countries.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchCountryMasSlice = createSlice({
  name: "fetchCountryMas",
  initialState,
  reducers: {
    clearCountryMas(state) {
      state.data = [];
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountryMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchCountryMas.fulfilled, (state, action: PayloadAction<CountryMasItem[]>) => {
        state.loading = false;
        state.data = action.payload;
        state.success = true;
      })
      .addCase(fetchCountryMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch countries.";
      });
  },
});

export const { clearCountryMas } = fetchCountryMasSlice.actions;
export default fetchCountryMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCountryMas = (s: any): CountryMasItem[] => (s.fetchCountryMas?.data as CountryMasItem[]) ?? [];
export const selectCountryMasLoading = (s: any): boolean => (s.fetchCountryMas?.loading as boolean) ?? false;
export const selectCountryMasError = (s: any): string | null => (s.fetchCountryMas?.error as string | null) ?? null;
export const selectCountryMasSuccess = (s: any): boolean => (s.fetchCountryMas?.success as boolean) ?? false;
