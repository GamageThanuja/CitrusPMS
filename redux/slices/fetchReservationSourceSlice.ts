// redux/slices/fetchReservationSourceSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ReservationSource {
  reservationSourceID: number;
  reservationSource: string;
}

/** ---- State ---- */
interface FetchReservationSourceState {
  loading: boolean;
  error: string | null;
  data: ReservationSource[];
}

const initialState: FetchReservationSourceState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/ReservationSource ---- */
export const fetchReservationSource = createAsyncThunk<
  ReservationSource[],
  void,
  { rejectValue: string }
>("reservationSource/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ReservationSource`);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch data.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchReservationSourceSlice = createSlice({
  name: "reservationSource",
  initialState,
  reducers: {
    resetReservationSourceState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReservationSource.fulfilled,
        (state, action: PayloadAction<ReservationSource[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchReservationSource.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch reservation sources.";
      });
  },
});

/** ---- Exports ---- */
export const { resetReservationSourceState } =
  fetchReservationSourceSlice.actions;
export default fetchReservationSourceSlice.reducer;

/** ---- Selectors ---- */
export const selectReservationSourceLoading = (state: any) =>
  state.reservationSource?.loading ?? false;
export const selectReservationSourceError = (state: any) =>
  state.reservationSource?.error ?? null;
export const selectReservationSourceData = (state: any) =>
  state.reservationSource?.data ?? [];
