// src/redux/slices/reservationRateDetailSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (from API) ---- */
export interface ReservationRateDetailItem {
  reservationMasID: number;
  recordID: number;
  reservationDetailID: number;
  roomNumber: string | null;
  dt: string | null; // ISO
  roomType: string | null;
  occupancy: string | null;
  mealPlan: string | null;
  roomRate: number | null;
  discPercen: number | null;
  discount: number | null;
  childRate: number | null;
  exBedRate: number | null;
  suppliment: number | null;
  isFOC: boolean | null;
  netRate: number | null;
  currencyCode: string | null;
  convRate: number | null;
  adult: number | null;
  child: number | null;
  isChecked: boolean | null;
  checkedBy: string | null;
  checkedAt: string | null; // ISO
  guestName: string | null;
  exBed: boolean | null;
  exBedCount: number | null;
  roomCount: number | null;
  isLocked: boolean | null;
  isNightAudit: boolean | null;
  updatedOn: string | null; // ISO
  updatedBy: string | null;
  finAct: boolean | null;

  // Allow unknown props
  [k: string]: any;
}

export interface FetchReservationRateDetailsParams {
  reservationDetailId: number;
}

interface ReservationRateDetailState {
  loading: boolean;
  error: string | null;
  items: ReservationRateDetailItem[];
  lastQuery: FetchReservationRateDetailsParams | null;
}

const initialState: ReservationRateDetailState = {
  loading: false,
  error: null,
  items: [],
  lastQuery: null,
};

/** Normalize API response to an array */
function normalizeArray(resData: any): ReservationRateDetailItem[] {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData as ReservationRateDetailItem[];
  if (typeof resData === "object") return [resData as ReservationRateDetailItem];
  return [];
}

/** ---- Thunk: GET /api/ReservationRateDetails/{reservationDetailId} ---- */
export const fetchReservationRateDetails = createAsyncThunk<
  ReservationRateDetailItem[],
  FetchReservationRateDetailsParams,
  { rejectValue: string }
>("reservationRateDetails/fetch", async (params, { rejectWithValue }) => {
  try {
    const { reservationDetailId } = params;
    
    if (!reservationDetailId) {
      return rejectWithValue("Reservation detail ID is required");
    }
    
    const url = `${API_BASE_URL}/api/ReservationRateDetails/${reservationDetailId}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch ReservationRateDetails.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const reservationRateDetailSlice = createSlice({
  name: "reservationRateDetails",
  initialState,
  reducers: {
    clearReservationRateDetails(state) {
      state.items = [];
      state.error = null;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationRateDetails.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = action.meta.arg || null;
      })
      .addCase(
        fetchReservationRateDetails.fulfilled,
        (state, action: PayloadAction<ReservationRateDetailItem[]>) => {
          state.loading = false;
          state.error = null; // Clear any previous errors
          state.items = action.payload;
        }
      )
      .addCase(fetchReservationRateDetails.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch ReservationRateDetails.";
        // Clear items on error to avoid showing stale data
        state.items = [];
      });
  },
});

export const { clearReservationRateDetails } = reservationRateDetailSlice.actions;
export default reservationRateDetailSlice.reducer;

/** ---- Selectors ---- */
export const selectReservationRateDetails = (state: { reservationRateDetail: ReservationRateDetailState }) =>
  state.reservationRateDetail?.items ?? [];
export const selectReservationRateDetailsLoading = (state: { reservationRateDetail: ReservationRateDetailState }) =>
  state.reservationRateDetail?.loading ?? false;
export const selectReservationRateDetailsError = (state: { reservationRateDetail: ReservationRateDetailState }) =>
  state.reservationRateDetail?.error ?? null;