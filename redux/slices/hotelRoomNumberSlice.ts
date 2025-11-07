import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
export interface HotelRoomNumber {
  roomID: number;
  hotelID: number;
  roomNo: string;
  roomTypeID: number;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  hotelRoomType: {
    hotelRoomTypeID: number;
    hotelID: number;
    roomType: string;
    adultSpace: number;
    childSpace: number;
    noOfRooms: number;
    cmid: string;
    createdTimeStamp: string;
    createdBy: string;
    updatedBy: string;
    finAct: boolean;
    updatedTimeStamp: string;
    roomDescription: string;
  };
  hotelMaster: {
    hotelID: number;
    hotelGUID: string;
    hotelName: string;
    hotelCode: number;
    hotelPhone: string;
    hotelEmail: string;
    hotelWeb: string;
    city: string;
    zipCode: string;
    country: string;
    createdOn: string;
    isOnTrial: boolean;
    noOfRooms: number;
    starCatgeory: number;
    lowestRate: number;
  };
}

interface HotelRoomNumberState {
  data: HotelRoomNumber[];
  loading: boolean;
  error: string | null;
}

// Initial State
const initialState: HotelRoomNumberState = {
  data: [],
  loading: false,
  error: null,
};

// Async Thunk
export const fetchHotelRoomNumbers = createAsyncThunk<
  HotelRoomNumber[], // Return type
  void, // Argument type
  { rejectValue: string }
>("hotelRoomNumbers/fetch", async (_, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!accessToken || !hotelId) throw new Error("Missing token or hotelId");

    const response = await axios.get(
      `${BASE_URL}/api/HotelRoomNumber/hotel-id/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || "Fetch failed";
    return rejectWithValue(message);
  }
});

// Slice
const hotelRoomNumberSlice = createSlice({
  name: "hotelRoomNumbers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelRoomNumbers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelRoomNumbers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHotelRoomNumbers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch room numbers";
      });
  },
});

export default hotelRoomNumberSlice.reducer;
