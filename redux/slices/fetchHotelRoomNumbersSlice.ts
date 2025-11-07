import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelRoomNumber {
  roomID: number;
  hotelID: number;
  roomTypeID: number;
  roomNo: string;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  hotelMaster?: any;
  hotelRoomType?: any;
}

interface FetchState {
  data: HotelRoomNumber[];
  loading: boolean;
  error: string | null;
}

const initialState: FetchState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchHotelRoomNumbers = createAsyncThunk<
  HotelRoomNumber[],
  void,
  { rejectValue: string }
>("hotelRoomNumbers/fetch", async (_, { rejectWithValue }) => {
  try {
    // Get token
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    if (!accessToken) {
      return rejectWithValue("No access token found");
    }

    // Get hotel ID
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!hotelId) {
      return rejectWithValue("No hotel ID found");
    }

    const response = await axios.get(
      `${BASE_URL}/api/HotelRoomNumber?hotelId=${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.detail || error.message || "Failed to fetch"
    );
  }
});

const fetchHotelRoomNumbersSlice = createSlice({
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
        state.error = action.payload || "Failed to fetch";
      });
  },
});

export default fetchHotelRoomNumbersSlice.reducer;
