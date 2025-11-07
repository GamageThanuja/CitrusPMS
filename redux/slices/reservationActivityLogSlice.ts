// redux/slices/reservationActivityLogSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string;
}

interface Hotel {
  hotelID: number;
  hotelGUID: string;
  finAct: boolean;
  hotelName: string;
  hotelCode: number;
  userGUID_HotelOwner: string;
  hotelType: string;
  hotelAddress: string;
  city: string;
  zipCode: string;
  country: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelWeb: string;
  noOfRooms: number;
  latitude: string;
  longitude: string;
  currencyCode: string;
  languageCode: string;
  createdOn: string;
  createdTimeStamp: string;
  lastUpdatedOn: string;
  lastUpdatedTimeStamp: string;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean;
  planId: number;
  hotelImage: HotelImage;
  lowestRate: number;
}

export interface ReservationActivityLogPayload {
  logId?: number;
  username: string;
  hotelId: number;
  reservationId: number;
  reservationDetailId: number;
  resLog: string;
  createdOn: string;
  platform: string;
  hotel: Hotel;
  reservationNo: string;
  roomNumber: string;
}

// Async thunk
export const createReservationActivityLog = createAsyncThunk(
  "reservationActivityLog/create",
  async (logData: ReservationActivityLogPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/ReservationActivityLog`,
        logData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Unknown error");
    }
  }
);

// Slice
const reservationActivityLogSlice = createSlice({
  name: "reservationActivityLog",
  initialState: {
    log: null as ReservationActivityLogPayload | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createReservationActivityLog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReservationActivityLog.fulfilled, (state, action) => {
        state.loading = false;
        state.log = action.payload;
      })
      .addCase(createReservationActivityLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default reservationActivityLogSlice.reducer;
