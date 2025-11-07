// redux/slices/transactionHeadersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export interface TransactionHeader {
  finAct: boolean;
  tranMasId: number;
  hotelCode: string;
  tranTypeId: number;
  tranDate: string; // ISO
  docNo: string;
  createdOn: string; // ISO
  lastModOn: string; // ISO
  lastModBy: string;
  nameID: number;
  code: string;
  name: string;
  tranValue: number;
  dueDate: string; // ISO
  paymentMethod: string;
  refNo: string;
  currencyCode: string;
  exchangeRate: number;
  isFinished: boolean;
  finActBy: string;
  finActOn: string; // ISO
  posCenterCode: string;
  invoiceType: string;
}

interface FetchParams {
  hotelCode?: string; // optional override; if omitted, read from localStorage.selectedProperty
}

interface State {
  items: TransactionHeader[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetchedAt: string | null;
}

/* --------------------------- Initial State --------------------------- */
const initialState: State = {
  items: [],
  status: "idle",
  error: null,
  lastFetchedAt: null,
};

/* ------------------------------ Thunk ------------------------------ */
export const fetchAllTransactionHeaders = createAsyncThunk<
  TransactionHeader[],
  FetchParams | undefined
>("transactionHeaders/fetchAll", async (params, { rejectWithValue }) => {
  try {
    // Tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    if (!accessToken) {
      return rejectWithValue("No access token found in localStorage.");
    }

    // Property (hotel)
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    // const hotelId = property.id; // available if you need it later
    const fallbackHotelCode: string | undefined = property?.hotelCode;

    const hotelCodeToUse = params?.hotelCode ?? fallbackHotelCode;
    if (!hotelCodeToUse) {
      return rejectWithValue(
        "hotelCode is required (none found in localStorage or params)."
      );
    }

    const url = `${BASE_URL}/api/Transaction/all-transaction-headers`;
    const res = await axios.get<TransactionHeader[]>(url, {
      params: { hotelCode: hotelCodeToUse },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    return res.data ?? [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.title ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to fetch transaction headers.";
    return rejectWithValue(msg);
  }
});

/* ------------------------------ Slice ------------------------------ */
const transactionHeadersSlice = createSlice({
  name: "transactionHeaders",
  initialState,
  reducers: {
    clearTransactionHeaders(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTransactionHeaders.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchAllTransactionHeaders.fulfilled,
        (state, action: PayloadAction<TransactionHeader[]>) => {
          state.items = action.payload;
          state.status = "succeeded";
          state.error = null;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchAllTransactionHeaders.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Request failed";
      });
  },
});

export const { clearTransactionHeaders } = transactionHeadersSlice.actions;
export default transactionHeadersSlice.reducer;

/* ---------------------------- Selectors ---------------------------- */
export const selectTransactionHeaders = (s: RootState) =>
  s.transactionHeaders.items;
export const selectTransactionHeadersStatus = (s: RootState) =>
  s.transactionHeaders.status;
export const selectTransactionHeadersError = (s: RootState) =>
  s.transactionHeaders.error;
export const selectTransactionHeadersLastFetchedAt = (s: RootState) =>
  s.transactionHeaders.lastFetchedAt;
