import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunk: Fetch meal allocations
export const fetchHotelMealAllocations = createAsyncThunk(
  "hotelMealAllocation/fetchHotelMealAllocations",
  async (_, { rejectWithValue }) => {
    try {
      // 🔑 Token setup
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // 🏨 Hotel ID setup
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!hotelId) {
        return rejectWithValue("Hotel ID not found in localStorage");
      }

      const response = await axios.get(
        `${BASE_URL}/api/HotelMealAllocation/by-hotel/${hotelId}`,
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
        error.response?.data?.detail || error.message || "Unknown error"
      );
    }
  }
);

interface HotelMealAllocationState {
  data: any[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: HotelMealAllocationState = {
  data: [],
  status: "idle",
  error: null,
};

const fetchHotelMealAllocationSlice = createSlice({
  name: "hotelMealAllocation",
  initialState,
  reducers: {
    resetHotelMealAllocationState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelMealAllocations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchHotelMealAllocations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchHotelMealAllocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetHotelMealAllocationState } =
  fetchHotelMealAllocationSlice.actions;

export const selectHotelMealAllocations = (state: RootState) =>
  state.fetchHotelMealAllocation;

export default fetchHotelMealAllocationSlice.reducer;
