// redux/slices/hotelImageDeleteSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunk for soft-deleting a hotel image
export const deleteHotelImage = createAsyncThunk(
  "hotelImage/delete",
  async (imageId: number, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      if (!accessToken) {
        return rejectWithValue("Access token not found.");
      }

      const response = await axios.delete(
        `${BASE_URL}/api/HotelImage/${imageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 204) {
        return imageId;
      } else {
        return rejectWithValue("Unexpected response status");
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Delete failed");
    }
  }
);

const hotelImageDeleteSlice = createSlice({
  name: "hotelImageDelete",
  initialState: {
    loading: false,
    error: null as string | null,
    deletedImageId: null as number | null,
  },
  reducers: {
    resetDeleteState: (state) => {
      state.loading = false;
      state.error = null;
      state.deletedImageId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHotelImage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.deletedImageId = null;
      })
      .addCase(deleteHotelImage.fulfilled, (state, action) => {
        state.loading = false;
        state.deletedImageId = action.payload;
      })
      .addCase(deleteHotelImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetDeleteState } = hotelImageDeleteSlice.actions;

export default hotelImageDeleteSlice.reducer;
