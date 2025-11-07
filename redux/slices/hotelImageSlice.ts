// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk to create a hotel image
export const createHotelImage = createAsyncThunk(
  "hotelImage/createHotelImage",
  async (imageData, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const payload = {
        ...imageData,
        hotelID: hotelId,
      };

      const response = await axios.post(`${BASE_URL}/api/HotelImage`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to upload hotel image"
      );
    }
  }
);

// Slice definition
const hotelImageSlice = createSlice({
  name: "hotelImage",
  initialState: {
    loading: false,
    error: null,
    success: false,
    image: null,
  },
  reducers: {
    resetHotelImageState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.image = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelImage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createHotelImage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.image = action.payload;
      })
      .addCase(createHotelImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetHotelImageState } = hotelImageSlice.actions;

export default hotelImageSlice.reducer;
