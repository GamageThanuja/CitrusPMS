import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RecordExpensePayload {
  accountIdDebit: number;
  accountIdCredit: number;
  hotelCode: string;
  finAct: boolean;
  tranTypeId: number;
  tranDate: string;
  effectiveDate: string;
  docNo: string;
  createdOn: string;
  tranValue: number;
  nameId: number;
  chequeNo: string;
  paymentMethod: string;
  chequeDate: string;
  exchangeRate: number;
  debit: number;
  amount: number;
  comment: string;
  createdBy: string;
  currAmount: number;
  currencyCode: string;
  convRate: string;
  credit: number;
  paymentReceiptRef: string;
  remarks: string;
  dueDate: string;
  refInvNo: string;
}

interface RecordExpenseState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: RecordExpenseState = {
  loading: false,
  success: false,
  error: null,
};

export const recordExpense = createAsyncThunk(
  "recordExpense/submit",
  async (payload: RecordExpensePayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/Purchase/record-expenses`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Something went wrong"
      );
    }
  }
);

const recordExpenseSlice = createSlice({
  name: "recordExpense",
  initialState,
  reducers: {
    resetRecordExpense(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(recordExpense.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(recordExpense.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(recordExpense.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetRecordExpense } = recordExpenseSlice.actions;
export default recordExpenseSlice.reducer;
