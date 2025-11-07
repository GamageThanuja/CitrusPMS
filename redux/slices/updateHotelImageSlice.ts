import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string;
  bucketName: string;
}

interface HotelImageState {
  updatedImage: HotelImage | null;
  loading: boolean;
  error: string | null;
}

const initialState: HotelImageState = {
  updatedImage: null,
  loading: false,
  error: null,
};

export const updateHotelImage = createAsyncThunk(
  "hotelImage/updateHotelImage",
  async (payload: HotelImage, { rejectWithValue }) => {
    try {
      // Get token
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const response = await axios.put(
        `${BASE_URL}/api/HotelImage/${payload.imageID}`,
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
      return rejectWithValue(error.response?.data?.detail || "Unknown error");
    }
  }
);

const updateHotelImageSlice = createSlice({
  name: "hotelImage",
  initialState,
  reducers: {
    resetHotelImageState: (state) => {
      state.updatedImage = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHotelImage.fulfilled, (state, action) => {
        state.loading = false;
        state.updatedImage = action.payload;
      })
      .addCase(updateHotelImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetHotelImageState } = updateHotelImageSlice.actions;
export default updateHotelImageSlice.reducer;
