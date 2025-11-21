// src/redux/slices/cancelReservationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---------- Types ---------- */

export interface CancelReservationPayload {
  reservationDetailId: number;   // used in path + body
  reservationId: number;
  reservationStatusId: number;
  status: string;
  cancelReason: string;
  cancelledBy: string;
  cancelledOn: string;           // ISO datetime string: new Date().toISOString()
}

// Adjust if you know the exact response type from the API
export type CancelReservationResponse = any;

interface CancelReservationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: CancelReservationResponse | null;
}

const initialState: CancelReservationState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---------- Thunk: PUT /api/Cancel/room/{reservationDetailId} ---------- */

export const cancelReservation = createAsyncThunk<
  CancelReservationResponse,
  CancelReservationPayload,
  { rejectValue: string }
>("cancelReservation/put", async (payload, { rejectWithValue }) => {
  try {
    const { reservationDetailId, ...rest } = payload;

    const response = await axios.put(
      `${API_BASE_URL}/api/Cancel/room/${reservationDetailId}`,
      {
        reservationDetailId,
        ...rest,
      }
    );

    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to cancel reservation.";
    return rejectWithValue(msg);
  }
});

/** ---------- Slice ---------- */

const cancelReservationSlice = createSlice({
  name: "cancelReservation",
  initialState,
  reducers: {
    resetCancelReservationState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cancelReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        cancelReservation.fulfilled,
        (state, action: PayloadAction<CancelReservationResponse>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload ?? null;
        }
      )
      .addCase(cancelReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to cancel reservation.";
      });
  },
});

/** ---------- Exports ---------- */

export const { resetCancelReservationState } = cancelReservationSlice.actions;
export default cancelReservationSlice.reducer;

/** ---------- Selectors ---------- */

export const selectCancelReservationLoading = (state: any) =>
  (state.cancelReservation?.loading as boolean) ?? false;

export const selectCancelReservationError = (state: any) =>
  (state.cancelReservation?.error as string | null) ?? null;

export const selectCancelReservationSuccess = (state: any) =>
  (state.cancelReservation?.success as boolean) ?? false;

export const selectCancelReservationData = (state: any) =>
  state.cancelReservation?.data ?? null;