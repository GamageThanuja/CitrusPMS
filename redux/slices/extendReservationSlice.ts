import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ExtendReservationPayload {
  reservationDetailId: number;
  reservationMasterId: number;
  roomId: number;
  newCheckOutDate: string;
  oldCheckOutDate: string;
  hotelCode: number;
  rate: number;
  mealPlan: string;
  currencyCode: string;
}

interface ExtendReservationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: ExtendReservationState = {
  loading: false,
  error: null,
  success: false,
};

// Async Thunk
export const extendReservation = createAsyncThunk(
  "reservation/extendReservation",
  async (data: ExtendReservationPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/Reservation/extend`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const extendReservationSlice = createSlice({
  name: "extendReservation",
  initialState,
  reducers: {
    resetExtendReservationState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(extendReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(extendReservation.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(extendReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetExtendReservationState } = extendReservationSlice.actions;
export default extendReservationSlice.reducer;
