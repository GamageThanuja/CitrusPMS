// redux/slices/createReservationRateDetailsSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ReservationRateDetail {
  reservationMasID: number;
  recordID: number;
  reservationDetailID: number;
  roomNumber: string;
  dt: string;
  roomType: string;
  occupancy: string;
  mealPlan: string;
  roomRate: number;
  discPercen: number;
  discount: number;
  childRate: number;
  exBedRate: number;
  suppliment: number;
  isFOC: boolean;
  netRate: number;
  currencyCode: string;
  convRate: number;
  adult: number;
  child: number;
  isChecked: boolean;
  checkedBy: string;
  checkedAt: string;
  guestName: string;
  exBed: boolean;
  exBedCount: number;
  roomCount: number;
  isLocked: boolean;
  isNightAudit: boolean;
  updatedOn: string;
  updatedBy: string;
  finAct: boolean;
}

/** ---- State ---- */
interface CreateReservationRateDetailState {
  loading: boolean;
  error: string | null;
  data: ReservationRateDetail | null;
}

const initialState: CreateReservationRateDetailState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: POST /api/ReservationRateDetails ---- */
export const createReservationRateDetail = createAsyncThunk<
  ReservationRateDetail,
  ReservationRateDetail,
  { rejectValue: string }
>(
  "reservationRateDetail/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ReservationRateDetails`,
        payload
      );
      return response.data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create reservation rate detail.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const createReservationRateDetailsSlice = createSlice({
  name: "createReservationRateDetails",
  initialState,
  reducers: {
    resetCreateReservationRateDetailsState(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReservationRateDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createReservationRateDetail.fulfilled,
        (state, action: PayloadAction<ReservationRateDetail>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(createReservationRateDetail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to create reservation rate detail.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateReservationRateDetailsState } =
  createReservationRateDetailsSlice.actions;
export default createReservationRateDetailsSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateReservationRateDetailsLoading = (state: any) =>
  (state.createReservationRateDetails?.loading as boolean) ?? false;
export const selectCreateReservationRateDetailsError = (state: any) =>
  (state.createReservationRateDetails?.error as string | null) ?? null;
export const selectCreateReservationRateDetailsData = (state: any) =>
  (state.createReservationRateDetails?.data as ReservationRateDetail) ?? null;
