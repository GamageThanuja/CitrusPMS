// src/redux/slices/cashPayoutSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with component usage) ---- */
export interface CashPayoutPayload {
  reservationDetailId: number;
  reservationMasterId: number;
  nameId: number;
  hotelCode: string;
  accountId: number;
  amount: number;
  tranDate: string; // ISO string
  currencyCode: string;
  conversionRate: number;
  remarks: string;
  tranTypeId: number;
  exchangeRate: number;
  createdBy: string;
  cashAccountId: number;
}

// what the API returns; usually same as payload plus maybe extra fields
export interface CashPayoutItem extends CashPayoutPayload {
  [k: string]: any;
}

/** ---- State ---- */
export interface CashPayoutState {
  loading: boolean;
  error: string | null;
  item: CashPayoutItem | null;
  success: boolean;
  lastCreatedAt: string | null;
}

const initialState: CashPayoutState = {
  loading: false,
  error: null,
  item: null,
  success: false,
  lastCreatedAt: null,
};

/** ---- Thunk: POST /api/cash-payout ---- */
export const createCashPayout = createAsyncThunk<
  CashPayoutItem,
  CashPayoutPayload,
  { rejectValue: string }
>("cashPayout/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/cash-payout`;

    // Send the payload directly in the same format as provided
    const res = await axios.post(url, payload);
    return res.data as CashPayoutItem;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create cash payout.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const cashPayoutSlice = createSlice({
  name: "cashPayout",
  initialState,
  reducers: {
    clearCashPayout(state) {
      state.loading = false;
      state.error = null;
      state.item = null;
      state.success = false;
      state.lastCreatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCashPayout.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createCashPayout.fulfilled,
        (state, action: PayloadAction<CashPayoutItem>) => {
          state.loading = false;
          state.item = action.payload;
          state.success = true;
          state.lastCreatedAt = new Date().toISOString();
        }
      )
      .addCase(createCashPayout.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create cash payout.";
      });
  },
});

export const { clearCashPayout } = cashPayoutSlice.actions;
export default cashPayoutSlice.reducer;

/** ---- Selectors ---- */
export const selectCashPayoutItem = (s: any) =>
  (s.cashPayout?.item as CashPayoutItem | null) ?? null;

export const selectCashPayoutLoading = (s: any) =>
  (s.cashPayout?.loading as boolean) ?? false;

export const selectCashPayoutError = (s: any) =>
  (s.cashPayout?.error as string | null) ?? null;

export const selectCashPayoutSuccess = (s: any) =>
  (s.cashPayout?.success as boolean) ?? false;

export const selectCashPayoutLastCreatedAt = (s: any) =>
  (s.cashPayout?.lastCreatedAt as string | null) ?? null;