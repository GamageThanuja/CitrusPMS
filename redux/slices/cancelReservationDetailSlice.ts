// src/redux/slices/cancelReservationDetailSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// Types
interface CancelReservationDetailState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: CancelReservationDetailState = {
  loading: false,
  error: null,
  success: false,
};

// Async thunk
export const cancelReservationDetail = createAsyncThunk<
  any, // you can type with API response shape if known
  number, // reservationDetailId
  { rejectValue: string }
>(
  "reservation/cancelReservationDetail",
  async (reservationDetailId, { rejectWithValue }) => {
    try {
      // Get token and property
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.put(
        `${BASE_URL}/api/Reservation/CancelDetail/${reservationDetailId}`,
        {},
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${accessToken}`,
            "Hotel-Id": hotelId, // add only if backend expects this header
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail ||
          err.message ||
          "Failed to cancel reservation detail"
      );
    }
  }
);

const cancelReservationDetailSlice = createSlice({
  name: "cancelReservationDetail",
  initialState,
  reducers: {
    resetCancelState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cancelReservationDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelReservationDetail.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(cancelReservationDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
        state.success = false;
      });
  },
});

export const { resetCancelState } = cancelReservationDetailSlice.actions;
export default cancelReservationDetailSlice.reducer;
