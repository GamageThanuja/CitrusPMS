import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Type Definition ---- */
export interface UpdateReservationDetailsPayload {
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
interface UpdateReservationDetailsState {
  loading: boolean;
  success: boolean;
  error: string | null;
  response: any;
}

const initialState: UpdateReservationDetailsState = {
  loading: false,
  success: false,
  error: null,
  response: null,
};

/** ---- Async Thunk ---- */
export const updateReservationDetails = createAsyncThunk<
  any,
  { reservationDetailId: number; data: UpdateReservationDetailsPayload },
  { rejectValue: string }
>(
  "reservationDetails/update",
  async ({ reservationDetailId, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/ReservationDetails/${reservationDetailId}`,
        data
      );
      return response.data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update reservation details.";
      return rejectWithValue(message);
    }
  }
);

/** ---- Slice ---- */
const updateReservationDetailsSlice = createSlice({
  name: "updateReservationDetails",
  initialState,
  reducers: {
    resetUpdateReservationDetailsState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateReservationDetails.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        updateReservationDetails.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(updateReservationDetails.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ||
          "Failed to update reservation details.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateReservationDetailsState } =
  updateReservationDetailsSlice.actions;
export default updateReservationDetailsSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateReservationDetailsLoading = (state: any) =>
  state.updateReservationDetails?.loading;
export const selectUpdateReservationDetailsError = (state: any) =>
  state.updateReservationDetails?.error;
export const selectUpdateReservationDetailsSuccess = (state: any) =>
  state.updateReservationDetails?.success;
export const selectUpdateReservationDetailsResponse = (state: any) =>
  state.updateReservationDetails?.response;
