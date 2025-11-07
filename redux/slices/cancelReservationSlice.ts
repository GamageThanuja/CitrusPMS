import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface CancelReservationPayload {
  reservationDetailId: number;
  reservationId: number;
  reservationStatusId: number;
  status: string;
  cancelReason: string;
  cancelledBy: string;
  cancelledOn: string;
}

interface CancelReservationState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: CancelReservationState = {
  loading: false,
  success: false,
  error: null,
};

export const cancelReservation = createAsyncThunk<
  any,
  CancelReservationPayload,
  { rejectValue: string }
>(
  "reservation/cancelReservation",
  async (
    {
      reservationDetailId,
      reservationId,
      reservationStatusId,
      status,
      cancelReason,
      cancelledBy,
      cancelledOn,
    },
    { rejectWithValue }
  ) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const response = await axios.put(
        `${BASE_URL}/api/Reservation/Cancel/reservation/${reservationDetailId}`, // ✅ fix this line
        {
          reservationDetailId,
          reservationId,
          reservationStatusId,
          status,
          cancelReason,
          cancelledBy,
          cancelledOn,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to cancel reservation"
      );
    }
  }
);

const cancelReservationSlice = createSlice({
  name: "cancelReservation",
  initialState,
  reducers: {
    resetCancelReservationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cancelReservation.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(cancelReservation.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { resetCancelReservationState } = cancelReservationSlice.actions;

export default cancelReservationSlice.reducer;
