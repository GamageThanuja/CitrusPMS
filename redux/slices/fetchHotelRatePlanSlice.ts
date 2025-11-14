// src/redux/slices/fetchHotelRatePlansSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------- Types (from sample API) ---------- */

export interface HotelMaster {
  hotelID: number;
  hotelName: string | null;
  hotelCode: string | null;
  currencyCode: string | null;
  [k: string]: any;
}

export interface RateCodeShort {
  rateCodeID: number;
  rateCode: string;
  description: string | null;
  createdOn: string | null; // ISO
  createdBy: string | null;
  [k: string]: any;
}

export interface HotelRoomTypeShort {
  hotelRoomTypeID: number;
  hotelID: number | null;
  roomType: string | null;
  adultSpace: number | null;
  childSpace: number | null;
  noOfRooms: number | null;
  [k: string]: any;
}

export interface MealPlanMasterShort {
  basisID: number;
  basis: string | null;
  cmRateID: string | null;
  showOnIBE: boolean;
  descOnIBE: string | null;
  [k: string]: any;
}

export interface HotelRatePlanItem {
  hotelID: number;
  hotelMaster: HotelMaster | null;

  rateCodeID: number;
  rateCode: RateCodeShort | null;

  title: string | null;

  hotelRoomType: HotelRoomTypeShort | null;
  roomTypeID: number;

  mealPlanID: number;
  mealPlanMaster: MealPlanMasterShort | null;

  currencyCode: string | null;
  childRate: number | null;
  createdOn: string | null; // ISO
  createdBy: string | null;

  cmid: string | null;
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string | null; // ISO or null
  defaultRate: number | null;

  // pax1..pax18 etc.
  pax1: number | null;
  pax2: number | null;
  pax3: number | null;
  pax4: number | null;
  pax5: number | null;
  pax6: number | null;
  pax7: number | null;
  pax8: number | null;
  pax9: number | null;
  pax10: number | null;
  pax11: number | null;
  pax12: number | null;
  pax13: number | null;
  pax14: number | null;
  pax15: number | null;
  pax16: number | null;
  pax17: number | null;
  pax18: number | null;

  child: number | null;
  dateFrom: string | null; // ISO
  dateTo: string | null;   // ISO

  sellMode: string | null;
  rateMode: string | null;
  primaryOccupancy: number | null;
  increaseBy: number | null;
  decreaseBy: number | null;

  // keep any unknown props
  [k: string]: any;
}

/* ---------- Query params ---------- */

export interface FetchHotelRatePlansParams {
  hotelId?: number;       // if omitted, we’ll try localStorage.selectedProperty.id
  rateCodeID?: number;
  roomTypeID?: number;
  mealPlanID?: number;
  currencyCode?: string;
}

/* ---------- State ---------- */

interface FetchHotelRatePlansState {
  loading: boolean;
  error: string | null;
  items: HotelRatePlanItem[];
  lastQuery: FetchHotelRatePlansParams | null;
}

const initialState: FetchHotelRatePlansState = {
  loading: false,
  error: null,
  items: [],
  lastQuery: null,
};

/* ---------- Thunk: GET /api/RateMas/GetHotelRatePlans ---------- */

export const fetchHotelRatePlans = createAsyncThunk<
  HotelRatePlanItem[],
  FetchHotelRatePlansParams | undefined,
  { rejectValue: string }
>("hotelRatePlans/fetch", async (params, { rejectWithValue }) => {
  const safeParams: FetchHotelRatePlansParams =
    (params ?? {}) as FetchHotelRatePlansParams;

  try {
    // Try to derive hotelId from localStorage if not provided
    let hotelId = safeParams.hotelId;
    if (
      (hotelId == null || Number.isNaN(hotelId)) &&
      typeof window !== "undefined"
    ) {
      const propRaw = localStorage.getItem("selectedProperty");
      if (propRaw) {
        try {
          const parsed = JSON.parse(propRaw);
          if (parsed?.id != null) {
            hotelId = Number(parsed.id);
          }
        } catch {
          // ignore parse error, hotelId stays undefined
        }
      }
    }

    const query: Record<string, any> = {};
    if (hotelId != null) query.hotelId = hotelId;
    if (safeParams.rateCodeID != null) query.rateCodeID = safeParams.rateCodeID;
    if (safeParams.roomTypeID != null) query.roomTypeID = safeParams.roomTypeID;
    if (safeParams.mealPlanID != null) query.mealPlanID = safeParams.mealPlanID;
    if (safeParams.currencyCode)
      query.currencyCode = safeParams.currencyCode;

    const qs = new URLSearchParams(query as any).toString();
    const url = `${API_BASE_URL}/api/RateMas/GetHotelRatePlans${
      qs ? `?${qs}` : ""
    }`;

    const res = await axios.get(url);
    const data = Array.isArray(res.data)
      ? (res.data as HotelRatePlanItem[])
      : [];

    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch Hotel Rate Plans.";
    return rejectWithValue(msg);
  }
});

/* ---------- Slice ---------- */

const fetchHotelRatePlansSlice = createSlice({
  name: "hotelRatePlans",
  initialState,
  reducers: {
    clearHotelRatePlans(state) {
      state.items = [];
      state.error = null;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelRatePlans.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery =
          (action.meta.arg as FetchHotelRatePlansParams | undefined) ?? null;
      })
      .addCase(
        fetchHotelRatePlans.fulfilled,
        (state, action: PayloadAction<HotelRatePlanItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchHotelRatePlans.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          "Failed to fetch Hotel Rate Plans.";
      });
  },
});

export const { clearHotelRatePlans } = fetchHotelRatePlansSlice.actions;
export default fetchHotelRatePlansSlice.reducer;

/* ---------- Selectors ---------- */

export const selectHotelRatePlansItems = (s: any) =>
  (s.fetchHotelRatePlans?.items as HotelRatePlanItem[]) ?? [];

export const selectHotelRatePlansLoading = (s: any) =>
  (s.fetchHotelRatePlans?.loading as boolean) ?? false;

export const selectHotelRatePlansError = (s: any) =>
  (s.fetchHotelRatePlans?.error as string | null) ?? null;

export const selectHotelRatePlansLastQuery = (s: any) =>
  (s.fetchHotelRatePlans?.lastQuery as FetchHotelRatePlansParams | null) ??
  null;