"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "@/redux/store";

/* ----------------------------- Types (trimmed) ----------------------------- */
export interface GlAccTransaction {
  accountID: number;
  debit?: number;
  credit?: number;
  amount?: number;
  memo?: string;
  tranDate?: string;
  propertyID?: number;
  // ...add other optional fields as needed
}

export interface GlTransactionRequest {
  glAccTransactions: GlAccTransaction[];
  tranTypeId?: number;
  tranDate?: string;
  docNo?: string;
  tranValue?: number;
  currencyCode?: string;
  isTaxInclusive?: boolean;
  // ...rest optional header fields if you need them
}

export type GlTransactionResponse = GlTransactionRequest;

type ApiError = {
  title?: string;
  status?: number;
  detail?: string;
  [k: string]: any;
};

/* --------------------------- Helpers: tokens/site --------------------------- */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAccessToken(): string | null {
  const raw = localStorage.getItem("hotelmateTokens");
  const parsed = raw ? JSON.parse(raw) : null;
  return parsed?.accessToken ?? null;
}

function getSelectedHotelId(): number | undefined {
  const raw = localStorage.getItem("selectedProperty");
  const property = raw ? JSON.parse(raw) : undefined;
  return property?.id;
}

function injectPropertyId(p: GlTransactionRequest): GlTransactionRequest {
  const hotelId = getSelectedHotelId();
  if (!hotelId) return p;
  return {
    ...p,
    glAccTransactions: (p.glAccTransactions ?? []).map((l) => ({
      propertyID: l.propertyID ?? hotelId,
      ...l,
    })),
  };
}

/* ---------------------------------- Thunk ---------------------------------- */
// NOTE: name is different from your existing slice/thunk
export const createGlTransaction = createAsyncThunk<
  GlTransactionResponse,
  GlTransactionRequest,
  { rejectValue: ApiError }
>(
  "glTransactionCreate/createGlTransaction",
  async (raw, { rejectWithValue }) => {
    try {
      const token = getAccessToken();
      if (!token) {
        return rejectWithValue({
          title: "Unauthorized",
          status: 401,
          detail: "Missing access token",
        });
      }

      const payload = injectPropertyId(raw);

      const res = await axios.post<GlTransactionResponse>(
        `${BASE_URL}/api/Transaction`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (err: any) {
      const data: ApiError | undefined = err?.response?.data;
      return rejectWithValue(
        data ?? {
          title: "Request failed",
          status: err?.response?.status ?? 500,
          detail:
            err?.message ?? "Unexpected error while creating GL transaction.",
        }
      );
    }
  }
);

/* --------------------------------- Slice ---------------------------------- */
interface GlTransactionCreateState {
  loading: boolean;
  error: ApiError | null;
  last?: GlTransactionResponse;
}

const initialState: GlTransactionCreateState = {
  loading: false,
  error: null,
  last: undefined,
};

const glTransactionCreateSlice = createSlice({
  name: "glTransactionCreate",
  initialState,
  reducers: {
    resetGlTransactionState(state) {
      state.loading = false;
      state.error = null;
      state.last = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGlTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createGlTransaction.fulfilled,
        (state, action: PayloadAction<GlTransactionResponse>) => {
          state.loading = false;
          state.last = action.payload;
        }
      )
      .addCase(createGlTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as ApiError) ?? {
          title: "Request failed",
          status: 500,
        };
      });
  },
});

export const { resetGlTransactionState } = glTransactionCreateSlice.actions;
export default glTransactionCreateSlice.reducer;

/* ------------------------------- Selectors -------------------------------- */
export const selectGlTxnCreateLoading = (s: RootState) =>
  s.glTransactionCreate.loading;
export const selectGlTxnCreateError = (s: RootState) =>
  s.glTransactionCreate.error;
export const selectGlTxnCreateLast = (s: RootState) =>
  s.glTransactionCreate.last;
