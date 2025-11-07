import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { TransactionCode } from "../../types/transactionCode";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface TransactionCodeState {
  data: TransactionCode[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TransactionCodeState = {
  data: [],
  loading: false,
  error: null,
};

// Thunk to fetch transaction codes
export const fetchTransactionCodes = createAsyncThunk<
  TransactionCode[],
  void,
  { rejectValue: string }
>("transactionCode/fetchTransactionCodes", async (_, { rejectWithValue }) => {
  const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
  const accessToken = tokens.accessToken;
  try {
    const response = await axios.get<TransactionCode[]>(
      `${BASE_URL}/api/TransactionCode`,
      {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log("TransactionCode raw response ✅:", response);
    return response.data;
  } catch (error: any) {
    console.error("TransactionCode fetch error:", error);
    return rejectWithValue(error.response?.data?.detail || "Fetch failed");
  }
});

export const transactionCodeSlice = createSlice({
  name: "transactionCode",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionCodes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTransactionCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export default transactionCodeSlice.reducer;
