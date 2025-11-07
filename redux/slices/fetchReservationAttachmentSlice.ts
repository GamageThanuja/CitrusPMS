import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchReservationAttachment = createAsyncThunk(
  "reservationAttachment/fetchReservationAttachment",
  async (reservationDetailId: number, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      if (!accessToken) throw new Error("Token not found");

      const response = await axios.get(
        `${BASE_URL}/api/ReservationAttachment/reservation-detail/${reservationDetailId}`,
        {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const fetchReservationAttachmentSlice = createSlice({
  name: "reservationAttachment",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservationAttachment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReservationAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default fetchReservationAttachmentSlice.reducer;
