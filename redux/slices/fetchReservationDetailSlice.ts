// src/redux/slices/reservationDetailSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types from API (trim/add as you need) ---- */
export interface ReservationDetailDTO {
  reservationID: number;
  type: string | null;
  reservationNo: string | null;
  status: string | null;
  title: string | null;
  bookerFullName: string | null;
  email: string | null;
  phone: string | null;
  hotelCode: string | null;
  createdBy: string | null;
  createdOn: string | null; // ISO
  nameID: number | null;
  code: string | null;
  name: string | null;
  refNo: string | null;
  currencyCode: string | null;
  flightNo: string | null;
  arrivalTime: string | null;
  airport: string | null;
  airportPickup: boolean | null;
  reservationDate: string | null;
  reservationDetailID: number;
  roomNumber: string | null;
  roomID: number | null;
  checkIN: string | null;  // ISO
  checkOUT: string | null; // ISO
  basis: string | null;
  adults: number | null;
  child: number | null;
  guest1: string | null;
  reservationStatusID: number | null;
  reservationStatus: string | null;
  reservationStatusColour: string | null;
  commentAtBooking: string | null;
  performaInvNo: string | null;
  nationality: string | null;
  bookingType: string | null;
  invoiceNo: string | null;
  currRateAtTheReserve: number | null;
  currRateAtTheCheckIn: number | null;
  currRateAtTheCheckOut: number | null;
  releaseDate: string | null;
  isReleased: boolean | null;
  tourNo: string | null;
  sourceOfBooking: string | null;
  groupName: string | null;
  remarks_Guest: string | null;
  remarks_Internal: string | null;
  country: string | null;
  releasedTimeStamp: string | null;
  checkINat: string | null;
  checkedInBy: string | null;
  checkOutAt: string | null;
  checkedOutBy: number | null;
  isCompliment: boolean | null;
  resvOccupancy: string | null;
  guestProfileID: number | null;
  extraBed: number | null;
  roomType: string | null;

  // Allow unknown props
  [k: string]: any;
}

export interface FetchReservationDetailParams {
  reservationDetailId: number;
  
}

interface ReservationDetailState {
  loading: boolean;
  error: string | null;
  data: ReservationDetailDTO | null;
  lastQuery: FetchReservationDetailParams | null;
}

const initialState: ReservationDetailState = {
  loading: false,
  error: null,
  data: null,
  lastQuery: null,
};

/** Normalize API response:
 * - If API returns an array, pick the first item.
 * - If it returns an object, use it directly.
 * - Otherwise return null.
 */
function normalizeReservationDetailResponse(res: any): ReservationDetailDTO | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? (res[0] as ReservationDetailDTO) : null;
  if (typeof res === "object") return res as ReservationDetailDTO;
  return null;
}

/** ---- Thunk: GET /api/ReservationDetails ----
 * Query param: reservationDetailId (int)
 */
export const fetchReservationDetail = createAsyncThunk<
  ReservationDetailDTO | null,
  FetchReservationDetailParams,
  { rejectValue: string }
>("reservationDetail/fetch", async (params, { rejectWithValue }) => {
  try {
    const { reservationDetailId } = params;
    
    if (!reservationDetailId) {
      return rejectWithValue("Reservation detail ID is required");
    }
    
    const url = `${API_BASE_URL}/api/ReservationDetails?reservationDetailId=${reservationDetailId}`;
    const res = await axios.get(url);
    return normalizeReservationDetailResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch ReservationDetails.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const reservationDetailSlice = createSlice({
  name: "reservationDetail",
  initialState,
  reducers: {
    clearReservationDetail(state) {
      state.data = null;
      state.error = null;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationDetail.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = action.meta.arg || null;
      })
      .addCase(
        fetchReservationDetail.fulfilled,
        (state, action: PayloadAction<ReservationDetailDTO | null>) => {
          state.loading = false;
          state.error = null; // Clear any previous errors
          state.data = action.payload;
        }
      )
      .addCase(fetchReservationDetail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch ReservationDetails.";
        // Clear data on error to avoid showing stale data
        state.data = null;
      });
  },
});

export const { clearReservationDetail } = reservationDetailSlice.actions;
export default reservationDetailSlice.reducer;

/** ---- Selectors ---- */
export const selectReservationDetail = (state: { reservationDetail: ReservationDetailState }) =>
  state.reservationDetail?.data ?? null;
export const selectReservationDetailLoading = (state: { reservationDetail: ReservationDetailState }) =>
  state.reservationDetail?.loading ?? false;
export const selectReservationDetailError = (state: { reservationDetail: ReservationDetailState }) =>
  state.reservationDetail?.error ?? null;