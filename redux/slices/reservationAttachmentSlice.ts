// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "@/config/axiosConfig";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk to upload attachment
export const uploadReservationAttachment = createAsyncThunk(
  "reservationAttachment/upload",
  async (attachmentData: any, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const response = await axiosInstance.post(
        `${BASE_URL}/api/ReservationAttachment`,
        attachmentData,
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

const reservationAttachmentSlice = createSlice({
  name: "reservationAttachment",
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadReservationAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadReservationAttachment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(uploadReservationAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reservationAttachmentSlice.reducer;
