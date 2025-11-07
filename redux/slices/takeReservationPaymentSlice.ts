import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

/** ---------- Types ---------- */

export interface ReservationPaymentRow {
  accountID: number; // ledger account ID (e.g., Cash, Card, Bank)
  hotelCode: string; // e.g. "HM-001"
  finAct: boolean; // financial active (true)
  tranTypeId: number; // your internal transaction type id
  tranDate: string; // ISO
  effectiveDate: string; // ISO
  docNo: string; // receipt/doc reference
  createdOn: string; // ISO
  tranValue: number; // often equals 'amount' (depends on backend)
  nameID: number; // guest name id if applicable
  chequeNo: string;
  paymentMethod: string; // "CASH" | "CARD" | "BANK TRAN" | etc.
  chequeDate: string; // ISO
  reservationDetailId: number;
  isGuestLedger: boolean; // true if GL, false if City Ledger, etc.
  reservationId: number;
  exchangeRate: number; // 1 for native currency
  debit: number; // 0 for payments (credit)
  amount: number; // amount in base currency
  comment: string;
  createdBy: string; // username
  currAmount: number; // amount in foreign currency (if any)
  currencyCode: string; // "LKR" | "USD" | ...
  convRate: string; // textual conversion if you keep it so
  credit: number; // = amount for payments
  paymentReceiptRef: string; // returned receipt id/reference if any
}

export type ReservationPaymentResponse = ReservationPaymentRow; // Swagger mirrors request

export interface TakePaymentState {
  data: ReservationPaymentResponse[] | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

/** ---------- Helpers ---------- */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
/**
 * Build a sane payment row (CREDIT).
 * You can override any field afterwards.
 */
export const buildPaymentRow = (
  p: Partial<ReservationPaymentRow>
): ReservationPaymentRow => {
  const now = new Date().toISOString();
  const amount = Number(p.amount ?? 0) || 0;
  return {
    accountID: p.accountID ?? 0,
    hotelCode: p.hotelCode ?? "HM-001",
    finAct: p.finAct ?? true,
    tranTypeId: p.tranTypeId ?? 0,
    tranDate: p.tranDate ?? now,
    effectiveDate: p.effectiveDate ?? now,
    docNo: p.docNo ?? "",
    createdOn: p.createdOn ?? now,
    tranValue: p.tranValue ?? amount,
    nameID: p.nameID ?? 0,
    chequeNo: p.chequeNo ?? "",
    paymentMethod: p.paymentMethod ?? "CASH",
    chequeDate: p.chequeDate ?? now,
    reservationDetailId: p.reservationDetailId ?? 0,
    isGuestLedger: p.isGuestLedger ?? true,
    reservationId: p.reservationId ?? 0,
    exchangeRate: p.exchangeRate ?? 1,
    debit: p.debit ?? 0, // payment -> no debit
    amount,
    comment: p.comment ?? "",
    createdBy: p.createdBy ?? "System",
    currAmount: p.currAmount ?? amount,
    currencyCode: p.currencyCode ?? "LKR",
    convRate: p.convRate ?? "1",
    credit: p.credit ?? amount, // payment -> credit equals amount
    paymentReceiptRef: p.paymentReceiptRef ?? "",
  };
};

/** ---------- Thunk ---------- */

export const takeReservationPayment = createAsyncThunk<
  ReservationPaymentResponse[], // return type
  ReservationPaymentRow[], // arg type
  { rejectValue: string }
>("reservation/takePayment", async (rows, thunkAPI) => {
  try {
    // Pull tokens and property/hotel info like you asked
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken as string | undefined;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property?.id as number | undefined;

    // (Optional) if your backend needs hotelId in header or you log it:
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (hotelId) headers["X-Hotel-Id"] = String(hotelId); // remove if not used by backend

    const url = `${API_BASE}/api/Reservation/take-payment`;

    const { data } = await axios.post<ReservationPaymentResponse[]>(url, rows, {
      headers,
    });

    return data;
  } catch (err) {
    const ax = err as AxiosError<any>;
    const msg =
      ax.response?.data?.detail ||
      ax.response?.data?.title ||
      ax.message ||
      "Payment failed";
    return thunkAPI.rejectWithValue(msg);
  }
});

/** ---------- Slice ---------- */

const initialState: TakePaymentState = {
  data: null,
  status: "idle",
  error: null,
};

const takeReservationPaymentSlice = createSlice({
  name: "takeReservationPayment",
  initialState,
  reducers: {
    resetTakePayment(state) {
      state.data = null;
      state.status = "idle";
      state.error = null;
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
        (state, action: PayloadAction<ReservationPaymentResponse[]>) => {
          state.status = "succeeded";
          state.data = action.payload || null;
        }
      )
      .addCase(takeReservationPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Payment failed";
      });
  },
});

export const { resetTakePayment } = takeReservationPaymentSlice.actions;
export default takeReservationPaymentSlice.reducer;

/** ---------- Selectors ---------- */

export const selectTakePaymentStatus = (s: any) =>
  (s.takeReservationPayment as TakePaymentState).status;

export const selectTakePaymentError = (s: any) =>
  (s.takeReservationPayment as TakePaymentState).error;

export const selectTakePaymentData = (s: any) =>
  (s.takeReservationPayment as TakePaymentState).data;
