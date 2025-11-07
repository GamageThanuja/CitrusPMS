// src/redux/slices/createBookingFeedSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (strongly typed to booking-feed schema) ---- */
export interface BookingFeedPromotionRef {
  id: string;
  title: string;
}

export interface BookingFeedDayBreakdown {
  amount: string;
  date: string;
  promotion?: BookingFeedPromotionRef | null;
  rateCode: number;
  ratePlan: string;
}

export interface BookingFeedCancelPenalty {
  amount: string;
  currency: string;
  from: string;
}

export interface BookingFeedRoomMeta {
  mapping_id: string;
  parent_rate_plan_id: string;
  rate_plan_code: number;
  room_type_code: string;
  days_breakdown: BookingFeedDayBreakdown[];
  cancel_penalties: BookingFeedCancelPenalty[];
  smokingPreferences: string;
  additionalDetails: string[];
  booking_com_room_index: number;
  meal_plan: string;
  policies: string;
  promotion: Array<{
    fromCode: string;
    fromName: string;
    promotionId: string;
    toCode: string;
  }>;
  room_remarks: string[];
}

export interface BookingFeedRoomTax {
  isInclusive: boolean;
  name: string;
  nights: number;
  persons: number;
  priceMode: string;
  price_per_unit: string;
  total_price: string;
  type: string;
  version: string;
}

export interface BookingFeedRoomGuest {
  name: string;
  surname: string;
}

export interface BookingFeedRoomOccupancy {
  children: number;
  adults: number;
  ages: number[];
  infants: number;
}

export interface BookingFeedRoomItem {
  is_foc: boolean;
  reservation_status_id: number;
  meta: BookingFeedRoomMeta;
  taxes: BookingFeedRoomTax[];
  services: string[];
  amount: string;
  days: Record<string, string>; // additionalProp* in swagger → open map
  guest_profile_id: number;
  ota_commission: string;
  guests: BookingFeedRoomGuest[];
  occupancy: BookingFeedRoomOccupancy;
  rate_plan_id: string;
  room_type_id: string;
  hotel_room_type_id: number;
  booking_room_id: string;
  checkin_date: string;
  checkout_date: string;
  is_cancelled: boolean;
  ota_unique_id: string;
  disc_percen: number;
  discount: number;
  child_rate: number;
  suppliment: number;
  net_rate: number;
  is_day_room: boolean;
  bed_type: string;
  res_occupancy: string;
}

export interface BookingFeedMetaRef {
  ruid: string;
  is_genius: boolean;
}

export interface BookingFeedCustomer {
  meta: BookingFeedMetaRef;
  name: string;
  zip: string;
  address: string;
  country: string;
  city: string;
  language: string;
  mail: string;
  phone: string;
  surname: string;
  company: string;
}

export interface BookingFeedOccupancy {
  children: number;
  adults: number;
  ages: number[];
  infants: number;
}

export interface BookingFeedGuarantee {
  token: string;
  cardNumber: string;
  cardType: string;
  cardholderName: string;
  cvv: string;
  expirationDate: string;
  isVirtual: boolean;
}

export interface BookingFeedAttributes {
  id: string;
  meta: BookingFeedMetaRef;
  status: string;
  services: string[];
  currency: string;
  amount: string;
  rate_code_id: number;
  created_by: string;
  remarks_internal: string;
  remarks_guest: string;
  guest_profile_id: number;
  agent: string;
  inserted_at: string; // ISO
  channel_id: string;
  property_id: string;
  hotel_id: number;
  unique_id: string;
  system_id: string;
  ota_name: string;
  booking_id: string;
  notes: string;
  arrival_date: string;
  arrival_hour: string;
  customer: BookingFeedCustomer;
  departure_date: string;
  deposits: string[];
  ota_commission: string;
  ota_reservation_code: string;
  payment_collect: string;
  payment_type: string;
  rooms: BookingFeedRoomItem[];
  occupancy: BookingFeedOccupancy;
  guarantee: BookingFeedGuarantee;
  secondary_ota: string;
  acknowledge_status: string;
  raw_message: string;
  is_crs_revision: boolean;
  is_day_room: boolean;
  release_date: string; // ISO
  ref_no: string;
  group_name: string;
  tour_no: string;
}

export interface BookingFeedRelationships {
  data: {
    property: { id: string; type: string };
    booking: { id: string; type: string };
  };
}

export interface BookingFeedRecord {
  id?: string;
  type?: string;
  attributes: BookingFeedAttributes;
  relationships: BookingFeedRelationships;
}

export interface BookingFeedRequestMeta {
  total: number;
  limit: number;
  order_by: string;
  page: number;
  order_direction: string;
}

export interface CreateBookingFeedPayload {
  data: BookingFeedRecord[];
  meta: BookingFeedRequestMeta;
  dateTime: string; // ISO
}

export interface CreateBookingFeedState {
  loading: boolean;
  error: string | null;
  success: boolean;
  item: any | null; // server response
  lastPayload: Partial<CreateBookingFeedPayload> | null;
}

const initialState: CreateBookingFeedState = {
  loading: false,
  error: null,
  success: false,
  item: null,
  lastPayload: null,
};

/** ---- Thunk: POST /api/booking-feed ---- */
export const createBookingFeed = createAsyncThunk<
  any,
  CreateBookingFeedPayload,
  { rejectValue: string }
>("bookingFeed/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/booking-feed`;
    const res = await axios.post(url, payload);
    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create booking feed.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createBookingFeedSlice = createSlice({
  name: "createBookingFeed",
  initialState,
  reducers: {
    clearCreateBookingFeed(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.item = null;
      state.lastPayload = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBookingFeed.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastPayload = action.meta.arg ?? null;
      })
      .addCase(createBookingFeed.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.item = action.payload ?? null;
        state.success = true;
      })
      .addCase(createBookingFeed.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to create booking feed.";
      });
  },
});

export const { clearCreateBookingFeed } = createBookingFeedSlice.actions;
export default createBookingFeedSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateBookingFeedLoading = (s: any) =>
  (s.createBookingFeed?.loading as boolean) ?? false;
export const selectCreateBookingFeedError = (s: any) =>
  (s.createBookingFeed?.error as string | null) ?? null;
export const selectCreateBookingFeedSuccess = (s: any) =>
  (s.createBookingFeed?.success as boolean) ?? false;
export const selectCreateBookingFeedItem = (s: any) =>
  (s.createBookingFeed?.item as any | null) ?? null;
