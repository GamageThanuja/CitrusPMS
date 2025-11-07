import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunk to handle the No-Show Reservation functionality
export const noShowReservation = createAsyncThunk(
  "noShowReservation/markAsNoShow",
  async (reservationDetails: {
    reservationDetailId: number;
    isChargable: boolean;
    currencyCode: string;
    amount: number;
    tranTypeId: number;
    drAccId: number;
    crAccId: number;
    checkInDate: string;
  }) => {
    // Fetching access token from localStorage
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // Fetching hotel id from localStorage
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    // Making PUT request to mark reservation as No-Show
    const response = await axios.put(
      `${API_BASE_URL}/api/Reservation/NoShow/${reservationDetails.reservationDetailId}`,
      {
        ...reservationDetails,
        hotelId, // Pass hotelId fetched from localStorage
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }
);

// State Type
interface NoShowState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

// Initial state
const initialState: NoShowState = {
  loading: false,
  error: null,
  successMessage: null,
};

// Slice
const noShowSlice = createSlice({
  name: "noShowReservation",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(noShowReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(noShowReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Reservation marked as No-Show successfully";
      })
      .addCase(noShowReservation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "An error occurred while processing";
      });
  },
});

export default noShowSlice.reducer;
