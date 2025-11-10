import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Type Definition ---- */
export interface ReservationDetailCreate {
  reservationDetailID: number;
  reservationID: number;
  roomID: number;
  checkIN: string;
  checkOUT: string;
  statusID: number;
  basis: string;
  adults: number;
  child: number;
  extraBed: number;
  comment: string;
  guest1: string;
  guest2: string;
  reservationStatusID: number;
  checkINat: string;
  checkedInBy: string;
  checkOutAt: string;
  checkedOutBy: string;
  market: string;
  isMiniBar: boolean;
  barInclude: string;
  isSafe: boolean;
  safeNo: string;
  isWifi: boolean;
  wifiUN: string;
  wifiPW: string;
  paidAtBooking: number;
  isAutoRate: boolean;
  avgBaseRate: number;
  netRate: number;
  extra: number;
  isAcknoledge: boolean;
  acknoOn: string;
  acknoBy: string;
  cancelledBy: string;
  cencelledOn: string;
  cancel_Reason: string;
  sc: number;
  tdl: number;
  nbt: number;
  vat: number;
  infant: number;
  childRate: number;
  exBedRate: number;
  folioNo: string;
  isDNR: boolean;
  roomType: string;
  roomListID: number;
  bedType: string;
  cancelRemarks: string;
  isOnAI: boolean;
  isGuestPayGreenTax: boolean;
  isHotelPayGreenTax: boolean;
  isCompliment: boolean;
  stopSales: boolean;
  resBlockDetailID: number;
  resvOccupancy: string;
  rateCategory: string;
  noOfRoomsBlocked: number;
  isRepeatGuest: boolean;
  guestProfileID: number;
  isFOC: boolean;
  pin: string;
  purposeOfTravel: string;
  isDayroom: boolean;
  addedBy: string;
  addedOn: string;
  roomCount: number;
  roomTypeID: number;
  roomRate: number;
  discountCodeApplied: string;
  totDiscPerRoomNight: number;
  discountType: string;
  discountVal: number;
  isBlockConvertedToRM: boolean;
  isBlock: boolean;
  discountRemakrs: string;
  block_ReservationDetailID: number;
  exBed: boolean;
  exBedCount: number;
  gssKey: string;
}

/** ---- State ---- */
interface CreateReservationDetailsState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: ReservationDetailCreate | null;
}

const initialState: CreateReservationDetailsState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Async Thunk ---- */
export const createReservationDetails = createAsyncThunk<
  ReservationDetailCreate,
  ReservationDetailCreate,
  { rejectValue: string }
>(
  "reservationDetails/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ReservationDetails/create-reservation-detail`,
        payload
      );
      return response.data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create reservation detail.";
      return rejectWithValue(message);
    }
  }
);

/** ---- Slice ---- */
const createReservationDetailsSlice = createSlice({
  name: "createReservationDetails",
  initialState,
  reducers: {
    resetCreateReservationDetailsState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReservationDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createReservationDetails.fulfilled,
        (state, action: PayloadAction<ReservationDetailCreate>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(createReservationDetails.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create reservation detail.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateReservationDetailsState } =
  createReservationDetailsSlice.actions;
export default createReservationDetailsSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateReservationDetailsLoading = (state: any) =>
  state.createReservationDetails?.loading;
export const selectCreateReservationDetailsError = (state: any) =>
  state.createReservationDetails?.error;
export const selectCreateReservationDetailsSuccess = (state: any) =>
  state.createReservationDetails?.success;
export const selectCreateReservationDetailsData = (state: any) =>
  state.createReservationDetails?.data;
