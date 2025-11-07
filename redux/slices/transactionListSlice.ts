// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchTransactions = createAsyncThunk(
  "transactions/fetch",
  async (params: {
    hotelCode: string;
    tranTypeId?: number;
    reservationId?: number;
    reservationDetailId?: number;
  }) => {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsed?.accessToken;

    const queryParams = new URLSearchParams();
    queryParams.append("hotelCode", params.hotelCode);
    if (params.tranTypeId)
      queryParams.append("tranTypeId", params.tranTypeId.toString());
    if (params.reservationId)
      queryParams.append("reservationId", params.reservationId.toString());
    if (params.reservationDetailId)
      queryParams.append(
        "reservationDetailId",
        params.reservationDetailId.toString()
      );

    const response = await axios.get(
      `${BASE_URL}/api/Transaction/list?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      }
    );

    return response.data;
  }
);

const transactionSlice = createSlice({
  name: "transactions",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default transactionSlice.reducer;
