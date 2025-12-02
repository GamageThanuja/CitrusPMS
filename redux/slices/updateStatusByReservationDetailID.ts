// src/redux/slices/reservationSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- THUNK: updateReservationStatus (e.g., recall = 4)
export const updateReservationStatus = createAsyncThunk(
  "reservation/updateReservationStatus",
  async (
    {
      reservationDetailId,
      statusId,
    }: { reservationDetailId: number; statusId: number },
    { rejectWithValue }
  ) => {
    try {
      const url = `${BASE_URL}/api/Reservation/detail/${reservationDetailId}/status`;

      // Backend expects the statusId in the body (as per your swagger comment)
      // No Authorization / tokens used here
      const res = await axios.put(url, statusId);

      return { reservationDetailId, statusId, data: res.data };
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        "Failed to update reservation status";
      return rejectWithValue(message);
    }
  }
);

// --- initial state (extend with your existing fields)
const initialState = {
  // ...your existing state
  updateStatusLoading: false,
  updateStatusSuccess: false,
  updateStatusError: null as string | null,
};

// --- slice
const reservationStatusSlice = createSlice({
  name: "reservation",
  initialState,
  reducers: {
    // ...your existing reducers
    clearUpdateStatusState(state) {
      state.updateStatusLoading = false;
      state.updateStatusSuccess = false;
      state.updateStatusError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ...other cases

      .addCase(updateReservationStatus.pending, (state) => {
        state.updateStatusLoading = true;
        state.updateStatusSuccess = false;
        state.updateStatusError = null;
      })
      .addCase(updateReservationStatus.fulfilled, (state) => {
        state.updateStatusLoading = false;
        state.updateStatusSuccess = true;
      })
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.updateStatusLoading = false;
        state.updateStatusSuccess = false;
        state.updateStatusError = (action.payload as string) ?? "Error";
      });
  },
});

export const { clearUpdateStatusState } = reservationStatusSlice.actions;
export default reservationStatusSlice.reducer;