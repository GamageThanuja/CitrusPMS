import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface MarketMas {
  marketID: number;
  marketName: string;
  finAct: string | null;
  hotelCode: string | null;
  showOnFO: boolean | null;
}

interface FetchMarketMasState {
  loading: boolean;
  error: string | null;
  data: MarketMas[];
}

/** ---- Initial State ---- */
const initialState: FetchMarketMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk ---- */
export const fetchMarketMas = createAsyncThunk<MarketMas[], void, { rejectValue: string }>(
  "marketMas/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/MarketMas`);
      return response.data as MarketMas[];
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to fetch market master data.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const fetchMarketMasSlice = createSlice({
  name: "fetchMarketMas",
  initialState,
  reducers: {
    resetMarketMasState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketMas.fulfilled, (state, action: PayloadAction<MarketMas[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMarketMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch market master data.";
      });
  },
});

/** ---- Exports ---- */
export const { resetMarketMasState } = fetchMarketMasSlice.actions;
export default fetchMarketMasSlice.reducer;

/** ---- Selectors ---- */
export const selectMarketMasData = (state: any) => state.fetchMarketMas?.data ?? [];
export const selectMarketMasLoading = (state: any) => state.fetchMarketMas?.loading ?? false;
export const selectMarketMasError = (state: any) => state.fetchMarketMas?.error ?? null;
