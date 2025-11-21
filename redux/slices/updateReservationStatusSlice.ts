// redux/slices/updateReservationStatusSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface UpdateReservationStatusRequest {
  reservationDetailId: number;
  status: number;        // Request body seems to be an integer (e.g., 0, 1, 2…)
}

export interface ReservationStatusResponse {
  reservationDetailId: number;
  status: number;
  updatedOn?: string;
  updatedBy?: string;
}

interface UpdateReservationStatusState {
  loading: boolean;
  error: string | null;
  data: ReservationStatusResponse | null;
}

const initialState: UpdateReservationStatusState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: PUT /api/detail/{reservationDetailId}/status ---- */
export const updateReservationStatus = createAsyncThunk<
  ReservationStatusResponse,
  UpdateReservationStatusRequest,
  { rejectValue: string }
>(
  "reservationDetail/updateStatus",
  async ({ reservationDetailId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/detail/${reservationDetailId}/status`,
        status,    // body is a simple integer
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return response.data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update reservation status.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const updateReservationStatusSlice = createSlice({
  name: "updateReservationStatus",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateReservationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateReservationStatus.fulfilled,
        (state, action: PayloadAction<ReservationStatusResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update reservation status.";
      });
  },
});

/** ---- Exports ---- */
export default updateReservationStatusSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateReservationStatusLoading = (state: any) =>
  state.updateReservationStatus?.loading ?? false;

export const selectUpdateReservationStatusError = (state: any) =>
  state.updateReservationStatus?.error ?? null;

export const selectUpdateReservationStatusData = (state: any) =>
  state.updateReservationStatus?.data ?? null;
