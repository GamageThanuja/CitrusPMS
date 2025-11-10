// redux/slices/updateReservationRateDetailsSlice.ts
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
interface UpdateReservationRateDetailState {
  loading: boolean;
  error: string | null;
  data: ReservationRateDetail | null;
}

const initialState: UpdateReservationRateDetailState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: PUT /api/ReservationRateDetails/{recordId} ---- */
export const updateReservationRateDetail = createAsyncThunk<
  ReservationRateDetail,
  { recordId: number; payload: ReservationRateDetail },
  { rejectValue: string }
>(
  "reservationRateDetail/update",
  async ({ recordId, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/ReservationRateDetails/${recordId}`,
        payload
      );
      return response.data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update reservation rate detail.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const updateReservationRateDetailsSlice = createSlice({
  name: "updateReservationRateDetails",
  initialState,
  reducers: {
    resetUpdateReservationRateDetailsState(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateReservationRateDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateReservationRateDetail.fulfilled,
        (state, action: PayloadAction<ReservationRateDetail>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateReservationRateDetail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to update reservation rate detail.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateReservationRateDetailsState } =
  updateReservationRateDetailsSlice.actions;
export default updateReservationRateDetailsSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateReservationRateDetailsLoading = (state: any) =>
  (state.updateReservationRateDetails?.loading as boolean) ?? false;
export const selectUpdateReservationRateDetailsError = (state: any) =>
  (state.updateReservationRateDetails?.error as string | null) ?? null;
export const selectUpdateReservationRateDetailsData = (state: any) =>
  (state.updateReservationRateDetails?.data as ReservationRateDetail) ?? null;
