// src/redux/slices/fetchreservtaionByIdSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface ReservationDetailsItem {
  reservationID: number;
  type: string;
  reservationNo: string;
  status: string;
  title: string;
  bookerFullName: string;
  email: string;
  phone: string;
  hotelCode: string;
  createdBy: string;
  createdOn: string; // ISO
  nameID: number;
  code: string;
  name: string;
  refNo: string;
  currencyCode: string;
  flightNo: string;
  arrivalTime: string;
  airport: string;
  airportPickup: boolean;
  reservationDate: string; // ISO
  reservationDetailID: number;
  roomNumber: string;
  roomID: number;
  checkIN: string; // ISO
  checkOUT: string; // ISO
  basis: string;
  adults: number;
  child: number;
  guest1: string;
  reservationStatusID: number;
  reservationStatus: string;
  reservationStatusColour: string;
  commentAtBooking: string;
  performaInvNo: string;
  nationality: string;
  bookingType: string;
  invoiceNo: string;
  currRateAtTheReserve: number;
  currRateAtTheCheckIn: number;
  currRateAtTheCheckOut: number;
  releaseDate: string; // ISO
  isReleased: boolean;
  tourNo: string;
  sourceOfBooking: string;
  groupName: string;
  remarks_Guest: string;
  remarks_Internal: string;
  country: string;
  releasedTimeStamp: string; // ISO
  checkINat: string; // ISO
  checkedInBy: string;
  checkOutAt: string; // ISO
  checkedOutBy: string;
  isCompliment: boolean;
  resvOccupancy: string;
  guestProfileID: number;
  extraBed: number;
  roomType: string;
  [k: string]: any; // allow extra props gracefully
}

/** ---- State ---- */
export interface FetchReservationDetailsByIdState {
  loading: boolean;
  error: string | null;
  items: ReservationDetailsItem[]; // API returns an array
  success: boolean;
}

const initialState: FetchReservationDetailsByIdState = {
  loading: false,
  error: null,
  items: [],
  success: false,
};

function normalizeArray(res: any): ReservationDetailsItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as ReservationDetailsItem[];
  if (typeof res === "object") return [res as ReservationDetailsItem];
  return [];
}

/** ---- Thunk: GET /api/ReservationDetailsByReservationID?reservationId= ---- */
export interface FetchReservationDetailsByIdParams {
  reservationId: number; // required by API
}

export const fetchReservationDetailsById = createAsyncThunk<
  ReservationDetailsItem[],
  FetchReservationDetailsByIdParams,
  { rejectValue: string }
>("reservationDetailsById/fetch", async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    qs.append("reservationId", String(params.reservationId));
    const url = `${API_BASE_URL}/api/ReservationDetailsByReservationID?${qs.toString()}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch reservation details.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchReservationDetailsByIdSlice = createSlice({
  name: "reservationDetailsById",
  initialState,
  reducers: {
    clearReservationDetailsById(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationDetailsById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchReservationDetailsById.fulfilled,
        (state, action: PayloadAction<ReservationDetailsItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchReservationDetailsById.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch reservation details.";
      });
  },
});

export const { clearReservationDetailsById } = fetchReservationDetailsByIdSlice.actions;
export default fetchReservationDetailsByIdSlice.reducer;

/** ---- Selectors ---- */
export const selectReservationDetailsItems = (s: any) =>
  (s.fetchReservationDetailsById?.items as ReservationDetailsItem[]) ?? [];
export const selectReservationDetailsLoading = (s: any) =>
  (s.fetchReservationDetailsById?.loading as boolean) ?? false;
export const selectReservationDetailsError = (s: any) =>
  (s.fetchReservationDetailsById?.error as string | null) ?? null;
export const selectReservationDetailsSuccess = (s: any) =>
  (s.fetchReservationDetailsById?.success as boolean) ?? false;
