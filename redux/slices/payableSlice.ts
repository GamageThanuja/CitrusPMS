import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

/* ===================== Types ===================== */

export interface PayableItem {
  balance: number;
  paymentReceiptRef?: string | null;
  hotelCode?: string | null;
  tranDate?: string | null; // ISO from API
  docNo?: string | null;
  tranValue?: number | null;
  paid?: number | null;
  code?: string | null;
  name?: string | null;
  age?: number | null;
  refInvNo?: string | null;
  currencyCode?: string | null;
}

type Status = "idle" | "loading" | "succeeded" | "failed";

export interface FetchPayablesArgs {
  accountId?: number; // default 3
  hotelCode?: string; // optional override
  signal?: AbortSignal; // optional: allow caller to cancel
}

interface PayableState {
  items: PayableItem[];
  status: Status;
  error: string | null;
  lastLoadedAt?: string; // ISO
  lastQuery?: { accountId: number; hotelCode?: string };
}

/* ===================== Helpers ===================== */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""; // e.g. https://api.yourdomain.com

function getAuthToken(): string | undefined {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    return parsed?.accessToken as string | undefined;
  } catch {
    return undefined;
  }
}

function getDefaultHotelCode(): string | undefined {
  try {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    return property?.hotelCode as string | undefined;
  } catch {
    return undefined;
  }
}

/* ===================== Thunk ===================== */

export const fetchPayables = createAsyncThunk<
  PayableItem[],
  FetchPayablesArgs | void,
  { rejectValue: string }
>("payables/fetch", async (args, { rejectWithValue }) => {
  const accountId = args?.accountId ?? 3;
  const hotelCode = args?.hotelCode ?? getDefaultHotelCode();
  const token = getAuthToken();

  const qs = new URLSearchParams();
  qs.set("accountId", String(accountId));
  if (hotelCode) qs.set("hotelCode", hotelCode);

  try {
    const res = await fetch(`${API_BASE}/api/Payable?${qs.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: args?.signal,
    });

    if (res.status === 401) {
      return rejectWithValue("Unauthorized (401): Check your login/token.");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return rejectWithValue(
        `Failed to load payables: ${res.status} ${res.statusText}${
          text ? ` - ${text}` : ""
        }`
      );
    }

    const data = (await res.json()) as PayableItem[];

    // Ensure types are normalized (numbers/strings may come as nulls)
    const normalized = (data ?? []).map((row) => ({
      balance: Number(row.balance ?? 0),
      paymentReceiptRef: row.paymentReceiptRef ?? null,
      hotelCode: row.hotelCode ?? null,
      tranDate: row.tranDate ?? null,
      docNo: row.docNo ?? null,
      tranValue: row.tranValue == null ? null : Number(row.tranValue),
      paid: row.paid == null ? null : Number(row.paid),
      code: row.code ?? null,
      name: row.name ?? null,
      age: row.age == null ? null : Number(row.age),
      refInvNo: row.refInvNo ?? null,
      currencyCode: row.currencyCode ?? null,
    }));

    return normalized;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return rejectWithValue("Request aborted");
    }
    return rejectWithValue(err?.message ?? "Network error");
  }
});

/* ===================== Slice ===================== */

const initialState: PayableState = {
  items: [],
  status: "idle",
  error: null,
  lastLoadedAt: undefined,
  lastQuery: undefined,
};

const payableSlice = createSlice({
  name: "payables",
  initialState,
  reducers: {
    clearPayables(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.lastLoadedAt = undefined;
      state.lastQuery = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayables.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        // track lastQuery from the args
        const args = action.meta.arg as FetchPayablesArgs | void;
        state.lastQuery = {
          accountId: args?.accountId ?? 3,
          hotelCode: args?.hotelCode ?? getDefaultHotelCode(),
        };
      })
      .addCase(
        fetchPayables.fulfilled,
        (state, action: PayloadAction<PayableItem[]>) => {
          state.items = action.payload;
          state.status = "succeeded";
          state.error = null;
          state.lastLoadedAt = new Date().toISOString();
        }
      )
      .addCase(fetchPayables.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) || action.error.message || "Unknown error";
      });
  },
});

export const { clearPayables } = payableSlice.actions;

/* ===================== Selectors ===================== */

export const selectPayables = (s: RootState) => s.payables.items;
export const selectPayablesStatus = (s: RootState) => s.payables.status;
export const selectPayablesError = (s: RootState) => s.payables.error;
export const selectPayablesLastLoadedAt = (s: RootState) =>
  s.payables.lastLoadedAt;
export const selectPayablesLastQuery = (s: RootState) => s.payables.lastQuery;

export default payableSlice.reducer;
