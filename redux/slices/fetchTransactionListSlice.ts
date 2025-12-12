// redux/slices/fetchTransactionListSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface TransactionListItem {
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
  paymentMethod: string;
  currencyCode: string;
  chequeNo: string;
  nameID: number;
  nameCode: string;
  name: string;
  bookerFullName: string;

  // allow any extra fields if backend adds more later
  [key: string]: any;
}

interface FetchTransactionListState {
  loading: boolean;
  error: string | null;
  data: TransactionListItem[];
}

/** ---- Initial State ---- */
const initialState: FetchTransactionListState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk ---- */

export interface FetchTransactionListArgs {
  hotelCode?: string;
  reservationId?: number;
  reservationDetailId?: number;
  tranTypeId?: number;
  invoiceType?: string;
}

export const fetchTransactionList = createAsyncThunk<
  TransactionListItem[],
  FetchTransactionListArgs | void,
  { rejectValue: string }
>("transactionList/fetch", async (args, { rejectWithValue }) => {
  try {
    const params: Record<string, any> = {};

    if (args?.hotelCode) params.hotelCode = args.hotelCode;
    if (typeof args?.reservationId === "number") {
      params.reservationId = args.reservationId;
    }
    if (typeof args?.reservationDetailId === "number") {
      params.reservationDetailId = args.reservationDetailId;
    }
    if (typeof args?.tranTypeId === "number") {
      params.tranTypeId = args.tranTypeId;
    }
    if (args?.invoiceType) params.invoiceType = args.invoiceType;

    const response = await axios.get(`${API_BASE_URL}/api/Transaction/list`, {
      params,
    });

    return response.data as TransactionListItem[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch transaction list.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchTransactionListSlice = createSlice({
  name: "fetchTransactionList",
  initialState,
  reducers: {
    resetTransactionListState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTransactionList.fulfilled,
        (state, action: PayloadAction<TransactionListItem[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchTransactionList.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch transaction list.";
      });
  },
});

/** ---- Exports ---- */
export const { resetTransactionListState } = fetchTransactionListSlice.actions;
export default fetchTransactionListSlice.reducer;

/** ---- Selectors ---- */
export const selectTransactionListData = (state: any) =>
  state.fetchTransactionList?.data ?? [];

export const selectTransactionListLoading = (state: any) =>
  state.fetchTransactionList?.loading ?? false;

export const selectTransactionListError = (state: any) =>
  state.fetchTransactionList?.error ?? null;