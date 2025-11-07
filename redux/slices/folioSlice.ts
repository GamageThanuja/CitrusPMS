// src/redux/slices/folioSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk to fetch folio transactions
export const fetchFolioByReservationDetailId = createAsyncThunk(
  "folio/fetchFolioByReservationDetailId",
  async (reservationDetailId: number, { rejectWithValue }) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;

      const response = await axios.get(
        `${BASE_URL}/api/Reservation/Folio/${reservationDetailId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "text/plain",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice definition
const folioSlice = createSlice({
  name: "folio",
  initialState: {
    data: [] as any[],
    loading: false,
    error: null as null | string,
  },
  reducers: {
    resetFolioState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolioByReservationDetailId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolioByReservationDetailId.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchFolioByReservationDetailId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetFolioState } = folioSlice.actions;
export default folioSlice.reducer;
