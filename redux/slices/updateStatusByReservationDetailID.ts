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
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;
      if (!accessToken) throw new Error("Token not found");

      const url = `${BASE_URL}/api/Reservation/detail/${reservationDetailId}/status`;

      // Swagger shows the body is just the numeric status id
      const res = await axios.put(url, statusId, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

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

// --- add fields to initialState
const initialState = {
  // ...your existing state
  updateStatusLoading: false,
  updateStatusSuccess: false,
  updateStatusError: null as string | null,
};

// --- slice (show only the extraReducers bit to merge into yours)
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
