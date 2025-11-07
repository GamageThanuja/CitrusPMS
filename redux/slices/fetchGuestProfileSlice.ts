// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk to fetch guest profiles
export const fetchGuestProfiles = createAsyncThunk(
  "guestProfiles/fetchGuestProfiles",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.get(`${BASE_URL}/api/GuestProfileMaster`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Filter by hotelId
      const filtered = response.data.filter(
        (profile) => profile.hotelId === hotelId
      );

      return filtered;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const hotelGuestProfileSlice = createSlice({
  name: "guestProfiles",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuestProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGuestProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch guest profiles.";
      });
  },
});

export default hotelGuestProfileSlice.reducer;
