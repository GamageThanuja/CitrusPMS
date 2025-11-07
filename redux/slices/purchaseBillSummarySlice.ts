// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchPurchaseBillSummary = createAsyncThunk(
  "purchaseBillSummary/fetch",
  async ({ hotelCode, accountId = 4, finAct = false }, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.get(
        `${BASE_URL}/api/Purchase/purchase-bill-summary`,
        {
          params: {
            hotelCode,
            accountId,
            finAct,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const purchaseBillSummarySlice = createSlice({
  name: "purchaseBillSummary",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseBillSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseBillSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPurchaseBillSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default purchaseBillSummarySlice.reducer;
