// redux/slices/takeReservationPaymentSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Request item (aligns with /api/take-payment body) ---- */
export interface TakeReservationPaymentItem {
  accountID: number;
  hotelCode: string;
  finAct: boolean;
  tranTypeId: number;
  tranDate: string;
  effectiveDate: string;
  docNo: string;
  createdOn: string;
  tranValue: number;
  nameID: number;
  chequeNo: string;
  paymentMethod: string;
  chequeDate: string;
  reservationDetailId: number;
  isGuestLedger: boolean;
  reservationId: number;
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
  [k: string]: any; // allow extra fields if API adds more
}

/** ---- Response item (we only *need* these fields) ---- */
export interface TakeReservationPaymentResponseItem {
  paymentReceiptRef?: string;
  docNo?: string;
  [k: string]: any;
}

/** ---- State ---- */
export interface TakeReservationPaymentState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  data: TakeReservationPaymentResponseItem[];
  lastPaidAt: string | null;
}

const initialState: TakeReservationPaymentState = {
  status: "idle",
  error: null,
  data: [],
  lastPaidAt: null,
};

function normalizeArray(res: any): TakeReservationPaymentResponseItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as TakeReservationPaymentResponseItem[];
  if (typeof res === "object") return [res as TakeReservationPaymentResponseItem];
  return [];
}

/** ---- Thunk: POST /api/take-payment ----
 *  Expects an array body: TakeReservationPaymentItem[]
 */
export const takeReservationPayment = createAsyncThunk<
  TakeReservationPaymentResponseItem[],
  TakeReservationPaymentItem[],
  { rejectValue: string }
>("takeReservationPayment/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/take-payment`;
    const res = await axios.post(url, payload);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to take reservation payment.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const takeReservationPaymentSlice = createSlice({
  name: "takeReservationPayment",
  initialState,
  reducers: {
    clearTakeReservationPayment(state) {
      state.status = "idle";
      state.error = null;
      state.data = [];
      state.lastPaidAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(takeReservationPayment.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        takeReservationPayment.fulfilled,
        (
          state,
          action: PayloadAction<TakeReservationPaymentResponseItem[]>
        ) => {
          state.status = "succeeded";
          state.data = action.payload ?? [];
          state.lastPaidAt = new Date().toISOString();
        }
      )
      .addCase(takeReservationPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ||
          "Failed to take reservation payment.";
      });
  },
});

export const { clearTakeReservationPayment } =
  takeReservationPaymentSlice.actions;
export default takeReservationPaymentSlice.reducer;

/** ---- Selectors (match usage in TakePaymentsDrawer) ---- */
export const selectTakePaymentStatus = (s: any) =>
  (s.takeReservationPayment?.status as
    | "idle"
    | "loading"
    | "succeeded"
    | "failed") ?? "idle";

export const selectTakePaymentError = (s: any) =>
  (s.takeReservationPayment?.error as string | null) ?? null;

export const selectTakePaymentData = (s: any) =>
  (s.takeReservationPayment?.data as TakeReservationPaymentResponseItem[]) ??
  [];

export const selectTakePaymentLastPaidAt = (s: any) =>
  (s.takeReservationPayment?.lastPaidAt as string | null) ?? null;