import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
interface ShortenReservationPayload {
  reservationDetailId: number;
  reservationMasterId: number;
  roomId: number;
  newCheckOutDate: string;
  oldCheckOutDate: string;
  hotelCode: string;
  mealPlan: string;
}

interface ShortenReservationState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

// Initial State
const initialState: ShortenReservationState = {
  loading: false,
  success: false,
  error: null,
};

// Thunk
export const shortenReservation = createAsyncThunk(
  "reservation/shorten",
  async (payload: ShortenReservationPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.post(
        `${BASE_URL}/api/Reservation/shorten`,

        payload,

        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || "Unknown error";
      return rejectWithValue(message);
    }
  }
);

// Slice
const shortenReservationSlice = createSlice({
  name: "shortenReservation",
  initialState,
  reducers: {
    resetShortenReservationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(shortenReservation.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(shortenReservation.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(shortenReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetShortenReservationState } = shortenReservationSlice.actions;
export default shortenReservationSlice.reducer;
