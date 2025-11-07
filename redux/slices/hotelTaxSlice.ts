// createHotelTaxSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelTaxPayload {
  hotelId: number;
  serviceCharge: number;
  tdl: number;
  sscl: number;
  vat: number;
}

export const createHotelTax = createAsyncThunk(
  "hotelTax/create",
  async (payload: HotelTaxPayload, { rejectWithValue }) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;

      const response = await axios.post(`${BASE_URL}/api/HotelTax`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.detail || err.message);
    }
  }
);

const createHotelTaxSlice = createSlice({
  name: "createHotelTax",
  initialState: { loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createHotelTax.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHotelTax.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createHotelTax.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create tax";
      });
  },
});

export default createHotelTaxSlice.reducer;
