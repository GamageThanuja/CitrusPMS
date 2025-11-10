// redux/slices/createReservationSourceSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ReservationSource {
  reservationSourceID: number;
  reservationSource: string;
}

interface CreateReservationSourceState {
  loading: boolean;
  error: string | null;
  data: ReservationSource | null;
}

const initialState: CreateReservationSourceState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: POST /api/ReservationSource ---- */
export const createReservationSource = createAsyncThunk<
  ReservationSource,
  { reservationSource: string },
  { rejectValue: string }
>("reservationSource/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ReservationSource`, payload);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create reservation source.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createReservationSourceSlice = createSlice({
  name: "createReservationSource",
  initialState,
  reducers: {
    resetCreateReservationSourceState(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReservationSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createReservationSource.fulfilled,
        (state, action: PayloadAction<ReservationSource>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(createReservationSource.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to create reservation source.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateReservationSourceState } =
  createReservationSourceSlice.actions;
export default createReservationSourceSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateReservationSourceLoading = (state: any) =>
  state.createReservationSource?.loading ?? false;
export const selectCreateReservationSourceError = (state: any) =>
  state.createReservationSource?.error ?? null;
export const selectCreateReservationSourceData = (state: any) =>
  state.createReservationSource?.data ?? null;
