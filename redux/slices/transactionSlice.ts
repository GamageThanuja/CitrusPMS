import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Transaction {
  finAct: boolean;
  tranMasId: number;
  hotelCode: string;
  tranType: string;
  tranDate: string;
  docNo: string;
  createdOn: string;
  createdBy: string;
  reservationNo: string;
  checkIn: string;
  checkOut: string;
  invoiceType: string;
  guest1: string;
  tranValue: number;
  roomNo: string;
  voidBy: string;
  voidOn: string;
  tranTypeId: number;
  reservationId: number;
  reservationDetailId: number;
}

// Thunk to fetch transactions
export const fetchTransactions = createAsyncThunk<
  Transaction[], // returned type
  {
    hotelCode: string;
    reservationId?: number;
    reservationDetailId?: number;
    tranTypeId?: number;
  }, // parameters to call
  { rejectValue: string }
>("transactions/fetchTransactions", async (params, { rejectWithValue }) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens.accessToken;

    const response = await axios.get(`${BASE_URL}/api/Transaction/list`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/plain",
      },
      params: {
        hotelCode: params.hotelCode,
        reservationId: params.reservationId,
        reservationDetailId: params.reservationDetailId,
        tranTypeId: params.tranTypeId,
      },
    });

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.detail || "Failed to fetch transactions."
    );
  }
});

interface TransactionState {
  data: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  data: [],
  loading: false,
  error: null,
};

export const transactionSlice = createSlice({
  name: "transactions",
  initialState,
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
        state.error = action.payload || "Unknown error";
      });
  },
});

export default transactionSlice.reducer;


