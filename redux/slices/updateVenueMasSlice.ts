// redux/slices/updateVenueMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface VenueMas {
  venueID: number;
  venue: string;
  hotelCode: string;
}

interface UpdateVenueMasState {
  loading: boolean;
  error: string | null;
  data: VenueMas | null;
}

const initialState: UpdateVenueMasState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: PUT /api/VenueMas/{hotelCode} ---- */
export const updateVenueMas = createAsyncThunk<
  VenueMas,
  { hotelCode: string; venueData: VenueMas },
  { rejectValue: string }
>("venueMas/update", async ({ hotelCode, venueData }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/VenueMas/${hotelCode}`, venueData);
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to update venue.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateVenueMasSlice = createSlice({
  name: "updateVenueMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateVenueMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVenueMas.fulfilled, (state, action: PayloadAction<VenueMas>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateVenueMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update venue.";
      });
  },
});

/** ---- Exports ---- */
export default updateVenueMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateVenueMasLoading = (state: any) => state.updateVenueMas?.loading ?? false;
export const selectUpdateVenueMasError = (state: any) => state.updateVenueMas?.error ?? null;
export const selectUpdateVenueMasData = (state: any) => state.updateVenueMas?.data ?? null;
