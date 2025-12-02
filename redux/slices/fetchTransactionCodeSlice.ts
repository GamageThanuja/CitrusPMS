// redux/slices/fetchTransactionCodeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface TransactionCode {
  transactionID: number;
  tranType: string;
  tranCode: string;
  tranName: string;
  accountID: number;
}

interface FetchTransactionCodeState {
  loading: boolean;
  error: string | null;
  data: TransactionCode[];
}

const initialState: FetchTransactionCodeState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/TransactionCode ---- */
export const fetchTransactionCode = createAsyncThunk<
  TransactionCode[],
  void,
  { rejectValue: string }
>("transactionCode/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/TransactionCode`);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch transaction codes.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchTransactionCodeSlice = createSlice({
  name: "fetchTransactionCode",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTransactionCode.fulfilled,
        (state, action: PayloadAction<TransactionCode[]>) => {
          state.loading = false;
          state.data = action.payload; // replace data
        }
      )
      .addCase(fetchTransactionCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch transaction codes.";
      });
  },
});

/** ---- Exports ---- */
export default fetchTransactionCodeSlice.reducer;

/** ---- Selectors ---- */
export const selectTransactionCodeLoading = (state: any) =>
  state.fetchTransactionCode?.loading ?? false;

export const selectTransactionCodeError = (state: any) =>
  state.fetchTransactionCode?.error ?? null;

export const selectTransactionCodeData = (state: any) =>
  state.fetchTransactionCode?.data ?? [];