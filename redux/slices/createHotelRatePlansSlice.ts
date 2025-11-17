// src/redux/slices/createHotelRatePlansSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------- Types (request body) ---------- */

// You can simplify these if you don’t need all fields on the frontend.
// I’ve kept them loose with lots of optional props + [k: string]: any.

export interface CreateHotelImage {
  imageID?: number;
  hotelID?: number;
  imageFileName?: string;
  description?: string;
  isMain?: boolean;
  finAct?: boolean;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  base64Image?: string;
  bucketName?: string;
  [k: string]: any;
}

export interface CreateHotelMaster {
  hotelID: number;
  hotelGUID?: string;
  finAct?: boolean;
  hotelName?: string;
  hotelCode?: string | number;
  userGUID_HotelOwner?: string;
  hotelType?: string;
  hotelAddress?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  hotelPhone?: string;
  hotelEmail?: string;
  hotelWeb?: string;
  noOfRooms?: number;
  latitude?: string;
  longitude?: string;
  currencyCode?: string;
  languageCode?: string;
  createdOn?: string;
  createdTimeStamp?: string;
  lastUpdatedOn?: string;
  lastUpdatedTimeStamp?: string;
  lastUpdatedBy_UserGUID?: string;
  starCatgeory?: number;
  cM_PropertyID?: string;
  hotelDesc?: string;
  isCMActive?: boolean;
  isIBEActive?: boolean;
  ibE_CancellationPolicy?: string;
  ibE_ChildPolicy?: string;
  ibE_TaxPolicy?: string;
  logoURL?: string;
  slug?: string;
  hotelDate?: string;
  isOnTrial?: boolean;
  ibeHeaderColour?: string;
  grC_Para1?: string;
  proforma_Terms?: string;
  grC_Para3?: string;
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNo?: string;
  swiftCode?: string;
  deactivatedBy?: string;
  deactivatedTimeStamp?: string;
  planId?: number;
  stripePaymentRef?: string;
  isPaymentTrue?: boolean;
  stripeAuthCode?: string;
  authTimeStamp?: string;
  hotelImage?: CreateHotelImage;
  lowestRate?: number;
  [k: string]: any;
}

export interface CreateRateCodeShort {
  rateCodeID: number;
  rateCode?: string;
  description?: string;
  createdOn?: string;
  createdBy?: string;
  [k: string]: any;
}

export interface CreateHotelRoomTypeShort {
  hotelRoomTypeID: number;
  hotelID: number;
  roomType?: string;
  adultSpace?: number;
  childSpace?: number;
  noOfRooms?: number;
  cmid?: string;
  createdTimeStamp?: string;
  createdBy?: string;
  updatedBy?: string;
  glAccountId?: number;
  finAct?: boolean;
  updatedTimeStamp?: string;
  roomDescription?: string;
  [k: string]: any;
}

export interface CreateMealPlanMasterShort {
  basisID: number;
  basis?: string;
  cmRateID?: string;
  showOnIBE?: boolean;
  descOnIBE?: string;
  [k: string]: any;
}

export interface CreateHotelRateRow {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string; // "YYYY-MM-DD"
  defaultRate: number;
  pax1: number;
  pax2: number;
  pax3: number;
  pax4: number;
  pax5: number;
  pax6: number;
  pax7: number;
  pax8: number;
  pax9: number;
  pax10: number;
  pax11: number;
  pax12: number;
  pax13: number;
  pax14: number;
  pax15: number;
  pax16: number;
  pax17: number;
  pax18: number;
  child: number;
  dateFrom: string; // ISO
  dateTo: string;   // ISO
  sellMode: string;
  rateMode: string;
  roomTypeID: number;
  primaryOccupancy: number;
  increaseBy: number;
  decreaseBy: number;
  [k: string]: any;
}

// Full request body to /api/RateMas/CreateHotelRatePlans
export interface CreateHotelRatePlanRequest {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string;       // "YYYY-MM-DD"
  defaultRate: number;
  pax1: number;
  pax2: number;
  pax3: number;
  pax4: number;
  pax5: number;
  pax6: number;
  pax7: number;
  pax8: number;
  pax9: number;
  pax10: number;
  pax11: number;
  pax12: number;
  pax13: number;
  pax14: number;
  pax15: number;
  pax16: number;
  pax17: number;
  pax18: number;
  child: number;
  dateFrom: string;       // ISO
  dateTo: string;         // ISO
  sellMode: string;
  rateMode: string;
  roomTypeID: number;
  primaryOccupancy: number;
  increaseBy: number;
  decreaseBy: number;

  hotelID: number;
  hotelMaster: CreateHotelMaster;

  rateCodeID: number;
  rateCode: CreateRateCodeShort;

  title: string;

  hotelRoomType: CreateHotelRoomTypeShort;

  mealPlanID: number;
  mealPlanMaster: CreateMealPlanMasterShort;

  currencyCode: string;
  childRate: number;
  createdOn: string;      // ISO
  createdBy: string;

  hotelRates: CreateHotelRateRow[];

  cmid: string;

  [k: string]: any;
}

/* ---------- State ---------- */

interface CreateHotelRatePlansState {
  loading: boolean;
  error: string | null;
  success: boolean;
  // you can store server response here if needed
  createdPlan: any | null;
}

const initialState: CreateHotelRatePlansState = {
  loading: false,
  error: null,
  success: false,
  createdPlan: null,
};

/* ---------- Thunk: POST /api/RateMas/CreateHotelRatePlans ---------- */

export const createHotelRatePlans = createAsyncThunk<
  any, // adjust if you know the exact response type
  CreateHotelRatePlanRequest,
  { rejectValue: string }
>("hotelRatePlans/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/RateMas/CreateHotelRatePlans`;
    const res = await axios.post(url, payload);
    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create Hotel Rate Plan.";
    return rejectWithValue(msg);
  }
});

/* ---------- Slice ---------- */

const createHotelRatePlansSlice = createSlice({
  name: "createHotelRatePlans",
  initialState,
  reducers: {
    resetCreateHotelRatePlans(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.createdPlan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelRatePlans.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createHotelRatePlans.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.createdPlan = action.payload ?? null;
        }
      )
      .addCase(createHotelRatePlans.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ??
          "Failed to create Hotel Rate Plan.";
      });
  },
});

export const { resetCreateHotelRatePlans } =
  createHotelRatePlansSlice.actions;
export default createHotelRatePlansSlice.reducer;

/* ---------- Selectors ---------- */

export const selectCreateHotelRatePlansLoading = (s: any) =>
  (s.createHotelRatePlans?.loading as boolean) ?? false;

export const selectCreateHotelRatePlansError = (s: any) =>
  (s.createHotelRatePlans?.error as string | null) ?? null;

export const selectCreateHotelRatePlansSuccess = (s: any) =>
  (s.createHotelRatePlans?.success as boolean) ?? false;

export const selectCreateHotelRatePlansCreatedPlan = (s: any) =>
  s.createHotelRatePlans?.createdPlan ?? null;