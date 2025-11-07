// src/redux/slices/createBookingFeedSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (kept pragmatic due to large nested shape) ---- */
export interface BookingFeedRecord {
  id?: string;
  type?: string;
  attributes: Record<string, any>; // use concrete sub-interfaces later if needed
  relationships?: Record<string, any>;
}

export interface CreateBookingFeedPayload {
  data: BookingFeedRecord[];
  meta?: Record<string, any>;
  dateTime?: string; // ISO
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
