import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ReservationRoom {
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
  guest2?: string;
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
  lastUpdatedOn?: string;
  lastUpdatedBy?: string;
  isCancelled: boolean;
  rooms: ReservationRoom[];
  guestProfileId: number;
}

interface ReservationResponse {
  reservations: Reservation[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
}

interface ReservationState {
  data: Reservation[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const initialState: ReservationState = {
  data: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
};

interface FetchReservationsArgs {
  reservationStatusId?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export const fetchReservationList = createAsyncThunk(
  "reservationList/fetch",
  async (params: FetchReservationsArgs, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelId = selectedProperty?.id || 3;

      const query = new URLSearchParams({
        hotelId: String(hotelId),
        ...(params.reservationStatusId && {
          reservationStatusId: String(params.reservationStatusId),
        }),
        ...(params.fromDate && { fromDate: params.fromDate }),
        ...(params.toDate && { toDate: params.toDate }),
        ...(params.searchTerm && { searchTerm: params.searchTerm }),
        page: String(params.page || 1),
        pageSize: String(params.pageSize || 10),
      });

      const res = await axios.get<ReservationResponse>(
        `${BASE_URL}/api/Reservation?${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "text/plain",
          },
        }
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch reservations"
      );
    }
  }
);

const reservationListSlice = createSlice({
  name: "reservationList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservationList.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.reservations;
        state.totalCount = action.payload.totalCount;
        state.pageSize = action.payload.pageSize;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchReservationList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default reservationListSlice.reducer;
