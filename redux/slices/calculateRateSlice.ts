import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface DailyRate {
  date: string; // "YYYY-MM-DD"
  rate: number; // per-day rate
}

export interface CalculatedRateResponse {
  hotelId: number;
  ratePlanId: number;
  currencyCode: string;
  mealPlanId: number;
  roomTypeId: number;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  paxCount: number;
  totalDays: number;
  totalRate: number;
  averageRate: number;
  childRate: number;
  dailyRates: DailyRate[];
}

export interface CalculateRateState {
  data: CalculatedRateResponse | null;
  loading: boolean;
  error: string | null;
  // keep the last used query to re-use/compare if needed
  lastQuery: {
    hotelId?: number;
    ratePlanId?: number;
    currencyCode?: string;
    mealPlanId?: number;
    roomTypeId?: number;
    startDate?: string;
    endDate?: string;
    paxCount?: number;
  } | null;
}

const initialState: CalculateRateState = {
  data: null,
  loading: false,
  error: null,
  lastQuery: null,
};

type FetchArgs = {
  hotelId?: number; // if omitted, we'll take from localStorage.selectedProperty.id
  ratePlanId: number | string; // rateCodeId in your UI
  currencyCode: string; // "LKR" | "USD" | ...
  mealPlanId: number | string; // selectedMealPlan
  roomTypeId: number | string; // row.roomType
  startDate: string; // "YYYY-MM-DD" (we will convert to ISO datetime)
  endDate: string; // "YYYY-MM-DD"
  paxCount: number; // row.adult
};

const toIsoDateTime = (d: string) => {
  // Accept "YYYY-MM-DD" and convert to ISO with 00:00:00
  // If already an ISO string, return as-is.
  if (d.includes("T")) return d;
  return new Date(`${d}T00:00:00`).toISOString();
};

export const fetchCalculatedRate = createAsyncThunk<
  CalculatedRateResponse,
  FetchArgs,
  { rejectValue: string }
>("calculateRate/fetchCalculatedRate", async (args, { rejectWithValue }) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens?.accessToken;

    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId =
      args.hotelId ?? selectedProperty?.id ?? selectedProperty?.propertyID;

    if (!hotelId) {
      return rejectWithValue("Hotel ID is missing");
    }

    const params = {
      hotelId: Number(hotelId),
      ratePlanId: Number(args.ratePlanId),
      currencyCode: String(args.currencyCode || "LKR"),
      mealPlanId: Number(args.mealPlanId || 0),
      roomTypeId: Number(args.roomTypeId),
      startDate: toIsoDateTime(args.startDate),
      endDate: toIsoDateTime(args.endDate),
      paxCount: Number(args.paxCount || 1),
    };

    const { data } = await axios.get<CalculatedRateResponse>(
      `${BASE_URL}/api/HotelRatePlans/calculate-rate`,
      {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      }
    );

    // Some backends might not fill averageRate/totalRate/totalDays; compute safely.
    const safeDaily = Array.isArray(data?.dailyRates) ? data.dailyRates : [];
    const days = safeDaily.length || Number(data?.totalDays || 0);
    const total = safeDaily.reduce((s, d) => s + Number(d.rate || 0), 0);
    const avg = days > 0 ? total / days : Number(data?.averageRate || 0);

    return {
      ...data,
      totalDays: days || Number(data?.totalDays || 0),
      totalRate: total || Number(data?.totalRate || 0),
      averageRate: Number.isFinite(avg) ? Number(avg) : 0,
      dailyRates: safeDaily,
    };
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.message ||
      "Failed to calculate rate";
    return rejectWithValue(msg);
  }
});

const calculateRateSlice = createSlice({
  name: "calculateRate",
  initialState,
  reducers: {
    clearCalculatedRate: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalculatedRate.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = action.meta.arg;
      })
      .addCase(fetchCalculatedRate.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCalculatedRate.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Rate fetch failed";
      });
  },
});

export const { clearCalculatedRate } = calculateRateSlice.actions;
export default calculateRateSlice.reducer;

// ---------- Selectors ----------
export const selectCalculatedRate = (state: any) => state.calculateRate.data;
export const selectCalculatedRateLoading = (state: any) =>
  state.calculateRate.loading;
export const selectCalculatedRateError = (state: any) =>
  state.calculateRate.error;

// Derived helpers (robust even if API omits some fields)
export const selectDailyRates = (state: any): DailyRate[] =>
  state.calculateRate?.data?.dailyRates || [];

export const selectDaysCount = (state: any): number =>
  selectDailyRates(state).length || state.calculateRate?.data?.totalDays || 0;

export const selectTotalFromDaily = (state: any): number =>
  selectDailyRates(state).reduce(
    (s: number, d: DailyRate) => s + Number(d.rate || 0),
    0
  );

export const selectAverageFromDaily = (state: any): number => {
  const days = selectDaysCount(state);
  const total = selectTotalFromDaily(state);
  return days > 0 ? total / days : 0;
};
