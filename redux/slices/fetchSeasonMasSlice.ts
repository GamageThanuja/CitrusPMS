// redux/slices/fetchSeasonMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SeasonMas {
  seasonID: number;
  season: string;
}

interface FetchSeasonMasState {
  loading: boolean;
  error: string | null;
  data: SeasonMas[];
}

const initialState: FetchSeasonMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/SeasonMas ---- */
export const fetchSeasonMas = createAsyncThunk<SeasonMas[], void, { rejectValue: string }>(
  "season/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/SeasonMas`);
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch seasons.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const fetchSeasonMasSlice = createSlice({
  name: "fetchSeasonMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeasonMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeasonMas.fulfilled, (state, action: PayloadAction<SeasonMas[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSeasonMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch seasons.";
      });
  },
});

/** ---- Exports ---- */
export default fetchSeasonMasSlice.reducer;

/** ---- Selectors ---- */
export const selectSeasonMasLoading = (state: any) => state.fetchSeasonMas?.loading ?? false;
export const selectSeasonMasError = (state: any) => state.fetchSeasonMas?.error ?? null;
export const selectSeasonMasData = (state: any) => state.fetchSeasonMas?.data ?? [];
