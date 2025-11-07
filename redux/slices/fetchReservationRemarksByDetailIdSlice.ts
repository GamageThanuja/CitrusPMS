import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
interface ReservationRemark {
  recordId: number;
  finAct: boolean;
  reservationId: number;
  reservationDetailId: number;
  remarks: string;
  createdBy: string;
  createdOn: string;
}

interface ReservationRemarksState {
  loading: boolean;
  error: string | null;
  data: ReservationRemark[];
}

const initialState: ReservationRemarksState = {
  loading: false,
  error: null,
  data: [],
};

// Async thunk
export const fetchReservationRemarksByDetailId = createAsyncThunk<
  ReservationRemark[],
  number
>(
  "reservationRemarks/fetchByDetailId",
  async (reservationDetailId, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.get(
        `${BASE_URL}/api/ReservationRemark/reservationDetail/${reservationDetailId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            HotelId: hotelId,
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch remarks"
      );
    }
  }
);

// Slice
const fetchReservationRemarksSlice = createSlice({
  name: "reservationRemarks",
  initialState,
  reducers: {
    clearReservationRemarks: (state) => {
      state.data = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationRemarksByDetailId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservationRemarksByDetailId.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReservationRemarksByDetailId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearReservationRemarks } = fetchReservationRemarksSlice.actions;
export default fetchReservationRemarksSlice.reducer;
