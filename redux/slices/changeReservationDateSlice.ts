import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ChangeDatePayload {
  reservationDetailId: number;
  reservationMasterId: number;
  roomId: number;
  newCheckInDate: string;
  oldCheckInDate: string;
  oldCheckOutDate: string;
  newCheckOutDate: string;
  hotelCode: number;
  rate: number;
  currencyCode: string;
  mealPlan: string;
}

export const changeReservationDate = createAsyncThunk(
  "reservation/changeDate",
  async (payload: ChangeDatePayload, { rejectWithValue }) => {
    try {
      // ✅ Read browser-only stuff HERE (not at module top-level)
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property?.id;

      const response = await axios.post(
        `${BASE_URL}/api/Reservation/change-date`,
        { ...payload, hotelCode: hotelId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err: any) {
      if (err.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue(err.message ?? "Request failed");
    }
  }
);

interface ChangeReservationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: any;
}

const initialState: ChangeReservationState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const changeReservationDateSlice = createSlice({
  name: "changeReservationDate",
  initialState,
  reducers: {
    resetChangeDateState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changeReservationDate.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(changeReservationDate.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(changeReservationDate.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { resetChangeDateState } = changeReservationDateSlice.actions;
export default changeReservationDateSlice.reducer;
