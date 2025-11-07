// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunk to create a new hotel room type image
export const createHotelRoomTypeImage = createAsyncThunk(
  "hotelRoomTypeImage/create",
  async (imageData, { rejectWithValue }) => {
    try {
      // Token setup
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // Hotel ID setup
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const payload = {
        ...imageData,
        hotelID: hotelId,
        createdOn: new Date().toISOString(),
        updatedOn: new Date().toISOString(),
      };

      const response = await axios.post(
        `${BASE_URL}/api/HotelRoomTypeImage`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const hotelRoomTypeImageSlice = createSlice({
  name: "hotelRoomTypeImage",
  initialState: {
    loading: false,
    error: null,
    success: false,
    data: null,
  },
  reducers: {
    resetHotelRoomImageState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelRoomTypeImage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createHotelRoomTypeImage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(createHotelRoomTypeImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetHotelRoomImageState } = hotelRoomTypeImageSlice.actions;
export default hotelRoomTypeImageSlice.reducer;
