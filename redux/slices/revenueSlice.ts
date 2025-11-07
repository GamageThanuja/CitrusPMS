import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RevenueState {
  loading: boolean;
  error: string | null;
  totalRevenue: number;
  hotelCode: string | null;
}

const initialState: RevenueState = {
  loading: false,
  error: null,
  totalRevenue: 0,
  hotelCode: null,
};

export const fetchRevenue = createAsyncThunk(
  "revenue/fetchRevenue",
  async (
    {
      startDate,
      endDate,
      tranTypeId,
      accountId,
      finAct,
    }: {
      startDate: string;
      endDate: string;
      tranTypeId: number;
      accountId: number;
      finAct: boolean;
    },
    thunkAPI
  ) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const property = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );

      const accessToken = tokens.accessToken;
      const hotelId = property.id;

      const response = await axios.get(`${BASE_URL}/api/Dashboard/revenue`, {
        params: {
          hotelCode: hotelId,
          startDate,
          endDate,
          tranTypeId,
          accountId,
          finAct,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      });

      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || error.message);
    }
  }
);

const revenueSlice = createSlice({
  name: "revenue",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.totalRevenue = action.payload.totalRevenue;
        state.hotelCode = action.payload.hotelCode;
      })
      .addCase(fetchRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default revenueSlice.reducer;
