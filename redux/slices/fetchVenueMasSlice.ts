// redux/slices/fetchVenueMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface VenueMas {
  venueID: number;
  venue: string;
  hotelCode: string;
}

interface FetchVenueMasState {
  loading: boolean;
  error: string | null;
  data: VenueMas[];
}

const initialState: FetchVenueMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/VenueMas/{hotelCode} ---- */
export const fetchVenueMas = createAsyncThunk<
  VenueMas[],
  string,
  { rejectValue: string }
>("venueMas/fetch", async (hotelCode, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/VenueMas/${hotelCode}`);
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to fetch venues.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchVenueMasSlice = createSlice({
  name: "fetchVenueMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenueMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVenueMas.fulfilled, (state, action: PayloadAction<VenueMas[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchVenueMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch venues.";
      });
  },
});

/** ---- Exports ---- */
export default fetchVenueMasSlice.reducer;

/** ---- Selectors ---- */
export const selectVenueMasLoading = (state: any) => state.fetchVenueMas?.loading ?? false;
export const selectVenueMasError = (state: any) => state.fetchVenueMas?.error ?? null;
export const selectVenueMasData = (state: any) => state.fetchVenueMas?.data ?? [];
