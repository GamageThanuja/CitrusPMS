import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

// -------- config
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// -------- types (relaxed but helpful)
export type DayBreakdown = {
  amount: string; // e.g. "120.00"
  date: string; // "YYYY-MM-DD"
  promotion?: { id?: string; title?: string };
  rateCode?: number;
  ratePlan?: string;
};

export type RoomMeta = {
  mapping_id?: string;
  parent_rate_plan_id?: string;
  rate_plan_code?: number;
  room_type_code?: string;
  days_breakdown?: DayBreakdown[];
  cancel_penalties?: Array<{ amount: string; currency: string; from: string }>;
  smokingPreferences?: string;
  additionalDetails?: string[];
  booking_com_room_index?: number;
  meal_plan?: string;
  policies?: string;
  promotion?: Array<{
    fromCode?: string;
    fromName?: string;
    promotionId?: string;
    toCode?: string;
  }>;
  room_remarks?: string[];
};

export type RoomItem = {
  is_foc?: boolean;
  reservation_status_id?: number;
  meta?: RoomMeta;
  taxes?: Array<{
    isInclusive?: boolean;
    name?: string;
    nights?: number;
    persons?: number;
    priceMode?: string;
    price_per_unit?: string;
    total_price?: string;
    type?: string;
    version?: string;
  }>;
  services?: string[];
  amount?: string;
  days?: Record<string, string>; // optional catch-all
  guest_profile_id?: number;
  ota_commission?: string;
  guests?: Array<{ name?: string; surname?: string }>;
  occupancy?: {
    children?: number;
    adults?: number;
    ages?: number[];
    infants?: number;
  };
  rate_plan_id?: string;
  room_type_id?: string;
  hotel_room_type_id?: number;
  booking_room_id?: string;
  checkin_date?: string; // "YYYY-MM-DD"
  checkout_date?: string; // "YYYY-MM-DD"
  is_cancelled?: boolean;
  ota_unique_id?: string;
  disc_percen?: number;
  discount?: number;
  child_rate?: number;
  suppliment?: number;
  net_rate?: number;
  is_day_room?: boolean;
  bed_type?: string;
  res_occupancy?: string;
};

export type CustomerBlock = {
  meta?: { ruid?: string; is_genius?: boolean };
  name?: string;
  zip?: string;
  address?: string;
  country?: string;
  city?: string;
  language?: string;
  mail?: string;
  phone?: string;
  surname?: string;
  company?: string;
};

export type BookingAttributes = {
  id?: string;
  meta?: { ruid?: string; is_genius?: boolean };
  status?: string;
  services?: string[];
  currency?: string;
  amount?: string;
  rate_code_id?: number;
  created_by?: string;
  remarks_internal?: string;
  remarks_guest?: string;
  guest_profile_id?: number;
  agent?: string;
  inserted_at?: string; // ISO
  channel_id?: string;
  property_id?: string;
  hotel_id?: number;
  unique_id?: string;
  system_id?: string;
  ota_name?: string;
  booking_id?: string;
  notes?: string;
  arrival_date?: string; // "YYYY-MM-DD"
  arrival_hour?: string; // "HH:mm"
  customer?: CustomerBlock;
  departure_date?: string; // "YYYY-MM-DD"
  deposits?: string[];
  ota_commission?: string;
  ota_reservation_code?: string;
  payment_collect?: string;
  payment_type?: string;
  rooms: RoomItem[];
  occupancy?: {
    children?: number;
    adults?: number;
    ages?: number[];
    infants?: number;
  };
  guarantee?: {
    token?: string;
    cardNumber?: string;
    cardType?: string;
    cardholderName?: string;
    cvv?: string;
    expirationDate?: string;
    isVirtual?: boolean;
  };
  secondary_ota?: string;
  acknowledge_status?: string;
  raw_message?: string;
  is_crs_revision?: boolean;
  is_day_room?: boolean;
  release_date?: string; // ISO
  ref_no?: string;
  group_name?: string;
  tour_no?: string;
};

export type BookingRevisionDataNode = {
  attributes: BookingAttributes;
  id?: string;
  type?: string;
  relationships?: {
    data?: {
      property?: { id?: string; type?: string };
      booking?: { id?: string; type?: string };
    };
  };
};

export type BookingRevisionPayload = {
  data: BookingRevisionDataNode[];
  meta?: {
    total?: number;
    limit?: number;
    order_by?: string;
    page?: number;
    order_direction?: string;
  };
  dateTime: string; // ISO string required by API (avoid trailing chars)
};

// Thunk arg
export type AddRoomThunkArg = {
  reservationId: number | string;
  bookingRevision: BookingRevisionPayload;
  token?: string; // optional bearer token
};

// API response (relax to any)
export type AddRoomResponse = any;

export type ReservationAddRoomState = {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: AddRoomResponse | null;
  lastPayload: BookingRevisionPayload | null; // useful for debugging
};

// -------- helpers
const isoNow = () => new Date().toISOString();
const toYMD = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Builder: build a minimal, valid bookingRevision with 1 room
// Use this if you want to quickly compose a correct payload from UI values.
export const buildAddRoomPayload = (opts: {
  hotelId: number;
  hotelRoomTypeId: number;
  checkIn: string | Date;
  checkOut: string | Date;
  currency: string;
  totalAmount: string; // "123.45"
  createdBy?: string;
  guestProfileId?: number;
  adults?: number;
  children?: number;
  ages?: number[];
  remarksInternal?: string;
  ratePlanId?: string;
  rateCodeId?: number;
  daysBreakdown?: DayBreakdown[]; // optional per-night pricing
}): BookingRevisionPayload => {
  const {
    hotelId,
    hotelRoomTypeId,
    checkIn,
    checkOut,
    currency,
    totalAmount,
    createdBy,
    guestProfileId,
    adults = 2,
    children = 0,
    ages = [],
    remarksInternal,
    ratePlanId,
    rateCodeId,
    daysBreakdown,
  } = opts;

  const ci = toYMD(checkIn);
  const co = toYMD(checkOut);

  const room: RoomItem = {
    hotel_room_type_id: hotelRoomTypeId,
    checkin_date: ci,
    checkout_date: co,
    amount: totalAmount,
    occupancy: { adults, children, ages, infants: 0 },
    meta: daysBreakdown?.length ? { days_breakdown: daysBreakdown } : undefined,
    rate_plan_id: ratePlanId,
    reservation_status_id: 1, // e.g. 1 = Booked (adjust to your enum)
  };

  const attributes: BookingAttributes = {
    hotel_id: hotelId,
    currency,
    amount: totalAmount,
    created_by: createdBy || "System",
    remarks_internal: remarksInternal,
    rooms: [room],
    arrival_date: ci,
    departure_date: co,
    guest_profile_id: guestProfileId,
    rate_code_id: rateCodeId,
    is_crs_revision: true,
  };

  return {
    data: [
      {
        attributes,
        type: "booking_revision",
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 1,
      order_by: "id",
      order_direction: "asc",
    },
    dateTime: isoNow(), // ✅ ensure valid ISO – fixes the “Expected end of string” issue
  };
};

// -------- thunk
export const addRoomToReservation = createAsyncThunk<
  AddRoomResponse,
  AddRoomThunkArg,
  { rejectValue: string }
>(
  "reservationAddRoom/addRoomToReservation",
  async (arg, { rejectWithValue }) => {
    const { reservationId, bookingRevision } = arg;

    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    try {
      const url = `${API_BASE_URL}/api/Reservation/${reservationId}/add-room`;

      const res = await axios.post(url, bookingRevision, {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      return res.data as AddRoomResponse;
    } catch (err: any) {
      // Extract useful API error details if present
      const apiErr =
        err?.response?.data?.title ||
        err?.response?.data?.errors ||
        err?.message ||
        "Failed to add room";
      return rejectWithValue(
        typeof apiErr === "string" ? apiErr : JSON.stringify(apiErr)
      );
    }
  }
);

// -------- slice
const initialState: ReservationAddRoomState = {
  loading: false,
  success: false,
  error: null,
  data: null,
  lastPayload: null,
};

const reservationAddRoomSlice = createSlice({
  name: "reservationAddRoom",
  initialState,
  reducers: {
    resetAddRoomState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
      state.lastPayload = null;
    },
    setDraftAddRoomPayload: (
      state,
      action: PayloadAction<BookingRevisionPayload>
    ) => {
      state.lastPayload = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addRoomToReservation.pending, (state, action) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        // Store the payload we tried to send for debugging

        state.lastPayload = action.meta?.arg?.bookingRevision ?? null;
      })
      .addCase(addRoomToReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(addRoomToReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Failed to add room";
      });
  },
});

// -------- exports
export const { resetAddRoomState, setDraftAddRoomPayload } =
  reservationAddRoomSlice.actions;
export default reservationAddRoomSlice.reducer;

// -------- selectors
export const selectReservationAddRoom = (s: RootState) => s.reservationAddRoom;
export const selectReservationAddRoomLoading = (s: RootState) =>
  s.reservationAddRoom.loading;
export const selectReservationAddRoomError = (s: RootState) =>
  s.reservationAddRoom.error;
export const selectReservationAddRoomSuccess = (s: RootState) =>
  s.reservationAddRoom.success;
export const selectReservationAddRoomData = (s: RootState) =>
  s.reservationAddRoom.data;
export const selectReservationAddRoomLastPayload = (s: RootState) =>
  s.reservationAddRoom.lastPayload;
