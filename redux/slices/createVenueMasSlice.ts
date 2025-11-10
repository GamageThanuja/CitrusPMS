// redux/slices/createVenueMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface VenueMas {
  venueID: number;
  venue: string;
  hotelCode: string;
}

interface CreateVenueMasState {
  loading: boolean;
  error: string | null;
  data: VenueMas | null;
}

const initialState: CreateVenueMasState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: POST /api/VenueMas ---- */
export const createVenueMas = createAsyncThunk<
  VenueMas,
  VenueMas,
  { rejectValue: string }
>("venueMas/create", async (venueData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/VenueMas`, venueData);
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to create venue.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createVenueMasSlice = createSlice({
  name: "createVenueMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createVenueMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVenueMas.fulfilled, (state, action: PayloadAction<VenueMas>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createVenueMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create venue.";
      });
  },
});

/** ---- Exports ---- */
export default createVenueMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateVenueMasLoading = (state: any) => state.createVenueMas?.loading ?? false;
export const selectCreateVenueMasError = (state: any) => state.createVenueMas?.error ?? null;
export const selectCreateVenueMasData = (state: any) => state.createVenueMas?.data ?? null;
