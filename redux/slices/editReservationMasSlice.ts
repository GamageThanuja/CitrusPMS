// src/redux/slices/editReservationMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Request body (trim/extend as you need) ---- */
export interface EditReservationMasPayload {
  reservationID: number | null;
  type: string | null;
  reservationNo: string | null;
  status: string | null;
  title: string | null;
  bookerFirstName: string | null;
  bookerLastName: string | null;
  email: string | null;
  phone: string | null;
  bookerFullName: string | null;
  reservationPaid: number | null;
  hotelCode: string | null;
  createdBy: string | null;
  createdOn: string | null; // ISO
  sessionID: string | null;
  reservationTypeID: number | null;
  taid: number | null;
  resCheckIn: string | null; // ISO
  resCheckOut: string | null; // ISO
  refNo: string | null;
  currencyCode: string | null;
  conversionRate: number | null;
  paymentTerm: string | null;
  flightNo: string | null;
  arrivalTime: string | null;
  airport: string | null;
  airportPickup: boolean | null;
  reservationDate: string | null; // ISO
  lastUpdatedOn: string | null;   // ISO
  lastUpdatedBy: string | null;
  ppNo: string | null;
  bookerNationality: string | null;
  bookerCountry: string | null;
  bookerAddress: string | null;
  bookerCity: string | null;
  commentAtBooking: string | null;
  ccNo: string | null;
  cardType: string | null;
  expMM: string | null;
  expYYYY: string | null;
  cvc: string | null;
  gender: string | null;
  bookerPP: string | null;
  isAllInclusiveRate: boolean | null;
  discountText: string | null;
  isNoTax: boolean | null;
  isGroup: boolean | null;
  performaInvNo: string | null;
  nationality: string | null;
  startFrom: string | null;
  bookingType: string | null;
  timeFrom: string | null; // ISO
  timeTo: string | null;   // ISO
  menu: string | null;
  eventType: string | null;
  invoiceNo: string | null;
  promoCode: string | null;
  isOnApproval: boolean | null;
  approvedBy: string | null;
  approvedOn: string | null; // ISO
  packageID: number | null;
  operatorID: number | null;
  andromeda_ResNo: string | null;
  isGSTInc: boolean | null;
  isSCInc: boolean | null;
  isGTInc: boolean | null;
  isNoSC: boolean | null;
  salesRep: string | null;
  noGreenTaxPax: number | null;
  arrFlight: string | null;
  deptFlight: string | null;
  rateCodeID: number | null;
  discountCode: string | null;
  currRateAtTheBlock: number | null;
  currRateAtTheReserve: number | null;
  currRateAtTheCheckIn: number | null;
  currRateAtTheCheckOut: number | null;
  isRateNegotiated: boolean | null;
  negotiatedRate: number | null;
  originalCurrCode: string | null;
  isInvoiceSent: boolean | null;
  releaseDate: string | null; // ISO
  isReleased: boolean | null;
  releasedBy: string | null;
  isCancelled: boolean | null;
  cancelledBy: string | null;
  cancelledOn: string | null; // ISO
  cancelReason: string | null;
  marketID: number | null;
  discountID: number | null;
  initiatedModule: string | null;
  tourNo: string | null;
  guestProfileID: number | null;
  sourceOfBooking: string | null;
  noOfPax: string | null;
  venue: string | null;
  eventDate: string | null; // ISO
  groupName: string | null;
  addedToCityLedgerBy: string | null;
  addedToCityLedgerOn: string | null; // ISO
  noOfRooms: number | null;
  isAcknoledge: boolean | null;
  tableNo: string | null;
  advSetoff: number | null;
  isBookingClosed: boolean | null;
  bookingClosedBy: string | null;
  bookingClosedAt: string | null; // ISO
  refInvoiceNo: string | null;
  acknoOn: string | null; // ISO
  acknoBy: string | null;
  isRatesLocked: boolean | null;
  isInvoiceGenerated: boolean | null;
  invoiceGeneratedBy: string | null;
  invoiceGeneratedOn: string | null; // ISO
  remarks_Internal: string | null;
  remarks_Guest: string | null;
  checkInTimeExp: string | null;  // ISO
  checkOutTimeExp: string | null; // ISO
  isRoomingListCreated: boolean | null;
  travePurposeID: number | null;
  isDayroom: boolean | null;
  isBlockConverted: boolean | null;
  blockConvertedBy: string | null;
  blockConvertedOn: string | null; // ISO
  cmid: string | null;
  ipG_transactionReference: string | null;
  ipG_orderId: string | null;
  ipG_transactionAmount: number | null;
  ipG_creditedAmount: number | null;
  ipG_transactionStatus: string | null;
  ipG_transactionMessage: string | null;
  ipG_transactionTimeInMillis: string | null;
  ipG_merchantParam1: string | null;
  ipG_merchantParam2: string | null;
  ipG_checksum: string | null;
  totalAMT: number | null;
  isNotificationSent: boolean | null;
  notificationSentTimeStamp: string | null; // ISO
  lastModType: string | null;
  releasedTimeStamp: string | null; // ISO
  country: string | null;

  // Allow unknown props safely
  [k: string]: any;
}

export interface EditReservationMasParams {
  reservationId: number;                       // path param
  body: Partial<EditReservationMasPayload>;    // send only what you're changing
}

export interface EditReservationMasState {
  loading: boolean;
  error: string | null;
  data: any | null;   // adjust if your API returns a specific shape
  lastQuery: EditReservationMasParams | null;
  success: boolean;
}

const initialState: EditReservationMasState = {
  loading: false,
  error: null,
  data: null,
  lastQuery: null,
  success: false,
};

/** Normalize API response defensively */
function normalizeResponse(res: any): any | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? res[0] : null;
  if (typeof res === "object") return res;
  return null;
}

/** ---- Thunk: PUT /api/ReservationMas/{reservationId} ---- */
export const editReservationMas = createAsyncThunk<
  any | null,
  EditReservationMasParams,
  { rejectValue: string }
>("reservationMas/edit", async (params, { rejectWithValue }) => {
  try {
    const { reservationId, body } = params;
    const url = `${API_BASE_URL}/api/ReservationMas/${reservationId}`;
    const res = await axios.put(url, body);
    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update Reservation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const editReservationMasSlice = createSlice({
  name: "editReservationMas",
  initialState,
  reducers: {
    clearEditReservationMas(state) {
      state.data = null;
      state.error = null;
      state.lastQuery = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(editReservationMas.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(
        editReservationMas.fulfilled,
        (state, action: PayloadAction<any | null>) => {
          state.loading = false;
          state.data = action.payload;
          state.success = true;
        }
      )
      .addCase(editReservationMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update Reservation.";
      });
  },
});

export const { clearEditReservationMas } = editReservationMasSlice.actions;
export default editReservationMasSlice.reducer;

/** ---- Selectors ---- */
export const selectEditReservationMas = (s: any) =>
  (s.editReservationMas?.data as any) ?? null;
export const selectEditReservationMasLoading = (s: any) =>
  (s.editReservationMas?.loading as boolean) ?? false;
export const selectEditReservationMasError = (s: any) =>
  (s.editReservationMas?.error as string | null) ?? null;
export const selectEditReservationMasSuccess = (s: any) =>
  (s.editReservationMas?.success as boolean) ?? false;