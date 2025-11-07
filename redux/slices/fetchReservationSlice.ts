import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
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
  guest2: string;
  basis: string;
}

interface Reservation {
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
  lastUpdatedOn: string;
  lastUpdatedBy: string;
  isCancelled: boolean;
  rooms: ReservationDetail[];
  guestProfileId: number;
}

interface ReservationState {
  reservations: Reservation[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

const initialState: ReservationState = {
  reservations: [],
  totalCount: 0,
  pageSize: 10,
  currentPage: 1,
  loading: false,
  error: null,
};

interface FetchParams {
  hotelId?: number;
  status?: string;
  reservationStatusId?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export const fetchReservations = createAsyncThunk(
  "reservations/fetchReservations",
  async (params: FetchParams, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.get(`${BASE_URL}/api/Reservation`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch reservations."
      );
    }
  }
);

const reservationSlice = createSlice({
  name: "reservations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReservations.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.reservations = action.payload.reservations;
          state.totalCount = action.payload.totalCount;
          state.pageSize = action.payload.pageSize;
          state.currentPage = action.payload.currentPage;
        }
      )
      .addCase(
        fetchReservations.rejected,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export default reservationSlice.reducer;
