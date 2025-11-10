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
interface FetchReservationRateDetailsState {
  loading: boolean;
  error: string | null;
  data: ReservationRateDetail[];
}

const initialState: FetchReservationRateDetailsState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk ---- */
export const fetchReservationRateDetails = createAsyncThunk<
  ReservationRateDetail[],
  number,
  { rejectValue: string }
>(
  "reservationRateDetails/fetchById",
  async (reservationDetailId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ReservationRateDetails/${reservationDetailId}`,
        {
          headers: {
            Accept: "text/plain",
          },
        }
      );
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch reservation rate details.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const fetchReservationRateDetailsSlice = createSlice({
  name: "fetchReservationRateDetails",
  initialState,
  reducers: {
    resetReservationRateDetailsState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationRateDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReservationRateDetails.fulfilled,
        (state, action: PayloadAction<ReservationRateDetail[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchReservationRateDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch reservation rate details.";
      });
  },
});

/** ---- Exports ---- */
export const { resetReservationRateDetailsState } = fetchReservationRateDetailsSlice.actions;
export default fetchReservationRateDetailsSlice.reducer;

/** ---- Selectors ---- */
export const selectReservationRateDetailsLoading = (state: any) =>
  (state.fetchReservationRateDetails?.loading as boolean) ?? false;
export const selectReservationRateDetailsError = (state: any) =>
  (state.fetchReservationRateDetails?.error as string | null) ?? null;
export const selectReservationRateDetailsData = (state: any) =>
  (state.fetchReservationRateDetails?.data as ReservationRateDetail[]) ?? [];
