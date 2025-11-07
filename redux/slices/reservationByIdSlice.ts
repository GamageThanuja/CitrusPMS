// src/redux/slices/reservationByIdSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ReservationRoom {
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
  guest2?: string | null;
  basis: string;
}

export interface Reservation {
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
  lastUpdatedOn?: string | null;
  lastUpdatedBy?: string | null;
  isCancelled: boolean;
  rooms: ReservationRoom[];
  guestProfileId: number;
  remarksGuest?: string;
  remarksInternal?: string;
}

interface ReservationByIdState {
  loading: boolean;
  error: string | null;
  data: Reservation | null;
}

const initialState: ReservationByIdState = {
  loading: false,
  error: null,
  data: null,
};

// Async thunk to fetch reservation by ID
export const fetchReservationById = createAsyncThunk<
  Reservation,
  number,
  { rejectValue: string }
>("reservationById/fetch", async (reservationId, { rejectWithValue }) => {
  try {
    // Tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    if (!accessToken) {
      return rejectWithValue("Access token not found");
    }

    // Selected property (if you need hotelId later)
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    const response = await axios.get(
      `${BASE_URL}/api/Reservation/${reservationId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Failed to fetch reservation";
    return rejectWithValue(message);
  }
});

const reservationByIdSlice = createSlice({
  name: "reservationById",
  initialState,
  reducers: {
    clearReservationById: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
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
        state.error = action.payload || "Error fetching reservation";
      });
  },
});

export const { clearReservationById } = reservationByIdSlice.actions;
export default reservationByIdSlice.reducer;
