import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ReservationDetail {
  reservationDetailID: number;
  roomID: number;
  roomNumber: string;
  roomType: string;
  checkIN: string;
  checkOUT: string;
  status: number;
  reservationStatusMaster: {
    reservationStatusID: number;
    reservationStatus: string;
    reservationStatusColour: string;
  };
  adults: number;
  child: number;
  extraBed: number;
  guest1: string;
  guest2: string | null;
  basis: string;
}

interface ReservationResponse {
  reservationID: number;
  reservationNo: string;
  status: string;
  type: string;
  bookerFullName: string;
  email: string;
  phone: string;
  refNo: string;
  hotelID: number;
  hotelName: string;
  resCheckIn: string;
  resCheckOut: string;
  totalNights: number;
  totalRooms: number;
  totalAmount: number;
  currencyCode: string;
  sourceOfBooking: string;
  createdOn: string;
  createdBy: string;
  lastUpdatedOn: string | null;
  lastUpdatedBy: string | null;
  isCancelled: boolean;
  rooms: ReservationDetail[];
  guestProfileId: number;
}

interface ReservationState {
  loading: boolean;
  data: ReservationResponse | null;
  error: string | null;
}

const initialState: ReservationState = {
  loading: false,
  data: null,
  error: null,
};

// Async thunk to fetch reservation by ID
export const fetchReservationById = createAsyncThunk<
  ReservationResponse,
  number
>("reservation/fetchById", async (reservationId, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsed?.accessToken;

    const response = await axios.get(
      `${BASE_URL}/api/Reservation/${reservationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch reservation"
    );
  }
});

const getReservationByIdSlice = createSlice({
  name: "reservationById",
  initialState,
  reducers: {
    resetReservationByIdState: (state) => {
      state.loading = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservationById.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReservationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetReservationByIdState } = getReservationByIdSlice.actions;

export default getReservationByIdSlice.reducer;
