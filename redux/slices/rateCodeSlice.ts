// src/redux/slices/rateCodeSlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define the RateCode interface
interface RateCode {
  rateCodeID: number;
  rateCode: string;
  description: string;
  createdOn: string | null;
  createdBy: string | null;
}

// Define the state interface for the rate codes slice
interface RateCodeState {
  data: RateCode[];
  loading: boolean;
  error: string | null;
}

// Initial state of the slice
const initialState: RateCodeState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk to fetch rate codes
export const fetchRateCodes = createAsyncThunk(
  "rateCodes/fetch", // The action type
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      // Making the GET request to fetch rate codes
      const response = await axios.get(`${BASE_URL}/api/RateCode`, {
        headers: {
          Accept: "text/plain", // Ensure the correct content type
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data as RateCode[]; // Return the fetched data
    } catch (error: any) {
      // If an error occurs, reject with a message
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create the slice with the state, reducers, and extraReducers for async actions
const rateCodeSlice = createSlice({
  name: "rateCodes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRateCodes.pending, (state) => {
        state.loading = true; // Set loading to true when the request is pending
        state.error = null; // Clear any previous errors
      })
      .addCase(fetchRateCodes.fulfilled, (state, action) => {
        state.loading = false; // Set loading to false when the request is successful
        state.data = action.payload; // Store the fetched rate codes in the data property
      })
      .addCase(fetchRateCodes.rejected, (state, action) => {
        state.loading = false; // Set loading to false when the request fails
        state.error = action.payload as string; // Store the error message in the error property
      });
  },
});

// Export the reducer to be used in the store
export default rateCodeSlice.reducer;
