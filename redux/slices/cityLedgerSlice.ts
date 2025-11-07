import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

/* ---------- Types ---------- */
export interface CityLedgerItem {
  balance: number;
  paymentReceiptRef?: string | null;
  reservationNo?: string | null;
  refNo?: string | null;
  tourNo?: string | null;
  name?: string | null;
  tranDate?: string | null; // ISO
  bookerFullName?: string | null;
  resCheckIn?: string | null; // ISO
  resCheckOut?: string | null; // ISO
}

type Status = "idle" | "loading" | "succeeded" | "failed";

interface FetchArgs {
  accountId?: number; // default 1
  /** override hotelCode if needed; otherwise it uses localStorage.selectedProperty.hotelCode */
  hotelCode?: string;
}

interface CityLedgerState {
  items: CityLedgerItem[];
  status: Status;
  error: string | null;
  lastLoadedAt?: string;
  lastQuery?: { accountId: number; hotelCode?: string };
}

/* ---------- Helpers ---------- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthAndHotel() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelCode: string | undefined = property?.hotelCode;

  return { accessToken, hotelCode };
}

/* ---------- Thunk ---------- */
/* ---------- Thunk ---------- */
export const fetchCityLedger = createAsyncThunk<
  CityLedgerItem[],
  FetchArgs | void,
  { rejectValue: string }
>("cityLedger/fetch", async (args, { rejectWithValue }) => {
  try {
    const { accessToken, hotelCode: storedHotel } = getAuthAndHotel();

    if (!accessToken) {
      return rejectWithValue("No access token found. Please sign in again.");
    }

    // 1) Use explicit arg first, fall back to saved hotel
    const hotelCode = args?.hotelCode ?? storedHotel;

    const accountId = args?.accountId ?? 1;

    const qs = new URLSearchParams();
    qs.set("accountId", String(accountId));
    if (hotelCode) qs.set("hotelCode", hotelCode);

    const res = await fetch(
      `${API_BASE}/api/Receivable/city-ledger?${qs.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      let detail = `${res.status} ${res.statusText}`;
      try {
        if (contentType.includes("application/json")) {
          const j = await res.json();
          detail = j?.detail || j?.title || detail;
        } else {
          const t = await res.text();
          if (t) detail = t;
        }
      } catch {
        /* ignore */
      }
      return rejectWithValue(detail);
    }

    const contentType = res.headers.get("content-type") || "";
    let data: any;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const txt = await res.text();
      try {
        data = JSON.parse(txt);
      } catch {
        data = [];
      }
    }

    return (Array.isArray(data) ? data : []) as CityLedgerItem[];
  } catch (err: any) {
    return rejectWithValue(err?.message || "Network error");
  }
});

/* ---------- Slice ---------- */
const initialState: CityLedgerState = {
  items: [],
  status: "idle",
  error: null,
};

const cityLedgerSlice = createSlice({
  name: "cityLedger",
  initialState,
  reducers: {
    clearCityLedger(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.lastLoadedAt = undefined;
      state.lastQuery = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCityLedger.pending, (state, action) => {
        state.status = "loading";
        state.error = null;

        // reflect real values that the thunk will use
        const arg = (action.meta.arg as FetchArgs | void) ?? {};
        const { hotelCode: storedHotel } = getAuthAndHotel();
        state.lastQuery = {
          accountId: arg.accountId ?? 1,
          hotelCode: arg.hotelCode ?? storedHotel,
        };
      })
      .addCase(
        fetchCityLedger.fulfilled,
        (state, action: PayloadAction<CityLedgerItem[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
          state.lastLoadedAt = new Date().toISOString();
        }
      )
      .addCase(fetchCityLedger.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ||
          action.error?.message ||
          "Request failed";
      });
  },
});

export const { clearCityLedger } = cityLedgerSlice.actions;
export default cityLedgerSlice.reducer;

/* ---------- Selectors ---------- */
export const selectCityLedger = (s: RootState) => s.cityLedger.items;
export const selectCityLedgerStatus = (s: RootState) => s.cityLedger.status;
export const selectCityLedgerError = (s: RootState) => s.cityLedger.error;
export const selectCityLedgerLastQuery = (s: RootState) =>
  s.cityLedger.lastQuery;
