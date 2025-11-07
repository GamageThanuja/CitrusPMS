import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelRoomType {
  hotelRoomTypeID: number;
  hotelID: number;
  roomType: string;
  adultSpace: number;
  childSpace: number;
  noOfRooms: number;
  cmid: string;
  createdTimeStamp: string;
  createdBy: string;
  updatedBy: string | null;
  finAct: boolean;
  updatedTimeStamp: string | null;
  roomDescription: string | null;
}

interface HotelRoomTypeState {
  data: HotelRoomType[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelRoomTypeState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchHotelRoomTypes = createAsyncThunk(
  "hotelRoomTypes/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelID = selectedProperty?.id;

      const response = await axios.get(
        `${BASE_URL}/api/HotelRoomType/hotel/${hotelID}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const hotelRoomTypesSlice = createSlice({
  name: "hotelRoomTypes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelRoomTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelRoomTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHotelRoomTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default hotelRoomTypesSlice.reducer;
