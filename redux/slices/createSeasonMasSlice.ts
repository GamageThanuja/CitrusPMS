// redux/slices/createSeasonMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SeasonMas {
  seasonID: number;
  season: string;
}

interface CreateSeasonMasState {
  loading: boolean;
  error: string | null;
  data: SeasonMas[];
}

const initialState: CreateSeasonMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: POST /api/SeasonMas ---- */
export const createSeasonMas = createAsyncThunk<
  SeasonMas,
  SeasonMas,
  { rejectValue: string }
>("season/create", async (newSeason, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/SeasonMas`, newSeason);
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to create season.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createSeasonMasSlice = createSlice({
  name: "createSeasonMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createSeasonMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSeasonMas.fulfilled, (state, action: PayloadAction<SeasonMas>) => {
        state.loading = false;
        // Always add to store
        state.data.push(action.payload);
      })
      .addCase(createSeasonMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create season.";
      });
  },
});

/** ---- Exports ---- */
export default createSeasonMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateSeasonMasLoading = (state: any) => state.createSeasonMas?.loading ?? false;
export const selectCreateSeasonMasError = (state: any) => state.createSeasonMas?.error ?? null;
export const selectCreateSeasonMasData = (state: any) => state.createSeasonMas?.data ?? [];
