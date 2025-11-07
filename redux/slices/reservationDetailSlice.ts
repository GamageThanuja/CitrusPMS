// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const fetchReservationDetail = createAsyncThunk(
  "reservationDetail/fetchReservationDetail",
  async (
    args: { reservationDetailId?: number; gssKey?: string },
    { rejectWithValue }
  ) => {
    try {
      // ⚠️ Read localStorage INSIDE thunk (avoids SSR/hydration issues)
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedProperty")
          : null;
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property?.id;

      const res = await axios.get(`${API_BASE_URL}/api/Reservation/detail`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          reservationDetailId: args?.reservationDetailId,
        },
      });

      return res.data; // includes gssKey from API (see your sample)
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error?.message);
    }
  }
);

const reservationDetailSlice = createSlice({
  name: "reservationDetail",
  initialState: {
    data: null as any,
    loading: false,
    error: null as any,
  },
  reducers: {
    resetReservationDetail: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchReservationDetail.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchReservationDetail.fulfilled, (s, a) => {
      s.loading = false;
      s.data = a.payload; // payload contains data.gssKey
    });
    b.addCase(fetchReservationDetail.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
    });
  },
});

export const { resetReservationDetail } = reservationDetailSlice.actions;
export default reservationDetailSlice.reducer;
