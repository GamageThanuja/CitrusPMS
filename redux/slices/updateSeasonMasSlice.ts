// redux/slices/updateSeasonMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SeasonMas {
  seasonID: number;
  season: string;
}

interface UpdateSeasonMasState {
  loading: boolean;
  error: string | null;
  data: SeasonMas[];
}

const initialState: UpdateSeasonMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: PUT /api/SeasonMas/{id} ---- */
export const updateSeasonMas = createAsyncThunk<
  SeasonMas,
  SeasonMas,
  { rejectValue: string }
>("season/update", async (seasonToUpdate, { rejectWithValue }) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/SeasonMas/${seasonToUpdate.seasonID}`,
      seasonToUpdate
    );
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to update season.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateSeasonMasSlice = createSlice({
  name: "updateSeasonMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateSeasonMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSeasonMas.fulfilled, (state, action: PayloadAction<SeasonMas>) => {
        state.loading = false;
        // Always update in store
        const index = state.data.findIndex(s => s.seasonID === action.payload.seasonID);
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          // If not exists, add it
          state.data.push(action.payload);
        }
      })
      .addCase(updateSeasonMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update season.";
      });
  },
});

/** ---- Exports ---- */
export default updateSeasonMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateSeasonMasLoading = (state: any) => state.updateSeasonMas?.loading ?? false;
export const selectUpdateSeasonMasError = (state: any) => state.updateSeasonMas?.error ?? null;
export const selectUpdateSeasonMasData = (state: any) => state.updateSeasonMas?.data ?? [];
