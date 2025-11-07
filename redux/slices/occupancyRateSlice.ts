import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface OccupancyRateData {
  totalRooms: number;
  hotelID: number;
  dt: string;
  status: string;
  occuRoomCount: number;
  occupancyRate: number;
}

interface OccupancyRateState {
  data: OccupancyRateData[];
  loading: boolean;
  error: string | null;
}

const initialState: OccupancyRateState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchOccupancyRate = createAsyncThunk<
  OccupancyRateData[], // return type
  { startDate: string; endDate: string }, // parameters
  { rejectValue: string }
>(
  "occupancyRate/fetch",
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelId = selectedProperty?.id;

      const response = await axios.get(
        `${BASE_URL}/api/Dashboard/occupancy-rate`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            hotelId,
            startDate,
            endDate,
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch occupancy rate"
      );
    }
  }
);

const occupancyRateSlice = createSlice({
  name: "occupancyRate",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOccupancyRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOccupancyRate.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOccupancyRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default occupancyRateSlice.reducer;
