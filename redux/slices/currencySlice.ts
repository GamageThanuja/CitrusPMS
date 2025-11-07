// src/redux/slices/currencySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface Currency {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
}

interface CurrencyState {
  items: Currency[];
  loading: boolean;
  error: string | null;
  // optional cache flag if you want to skip refetching
  loadedOnce: boolean;
}

const initialState: CurrencyState = {
  items: [],
  loading: false,
  error: null,
  loadedOnce: false,
};

// If you have an env/config, replace with it.
// Keep absolute URL if that’s your convention elsewhere.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchCurrencies = createAsyncThunk<Currency[]>(
  "currency/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken as string | undefined;

      const res = await axios.get<Currency[]>(`${API_BASE}/api/Currency`, {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
          Accept: "text/plain", // per docs
        },
      });

      return res.data ?? [];
    } catch (err: any) {
      // normalize error message
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        "Failed to fetch currencies";
      return rejectWithValue(message);
    }
  }
);

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    // Handy if you need to clear between property switches
    resetCurrencies(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.loadedOnce = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCurrencies.fulfilled,
        (state, action: PayloadAction<Currency[]>) => {
          state.items = action.payload;
          state.loading = false;
          state.error = null;
          state.loadedOnce = true;
        }
      )
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch currencies";
      });
  },
});

export const { resetCurrencies } = currencySlice.actions;
export default currencySlice.reducer;

// Selectors
export const selectCurrencies = (state: any) =>
  (state.currency?.items as Currency[]) || [];
export const selectCurrencyLoading = (state: any) =>
  Boolean(state.currency?.loading);
export const selectCurrencyError = (state: any) =>
  state.currency?.error as string | null;
