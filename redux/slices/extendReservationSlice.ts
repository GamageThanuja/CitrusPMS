// src/redux/slices/extendReservationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with /api/extend body) ---- */
export interface ExtendReservationPayload {
  reservationDetailId: number;
  reservationMasterId: number;
  roomId: number;
  newCheckOutDate: string; // ISO string
  oldCheckOutDate: string; // ISO string
  hotelCode: number;
  rate: number;
  currencyCode: string;
  mealPlan: string;
  [k: string]: any;
}

// Response shape (relaxed to accept whatever backend sends)
export interface ExtendReservationItem {
  reservationDetailId?: number;
  reservationMasterId?: number;
  roomId?: number;
  newCheckOutDate?: string;
  oldCheckOutDate?: string;
  hotelCode?: number;
  rate?: number;
  currencyCode?: string;
  mealPlan?: string;
  message?: string;
  status?: string | number;
  [k: string]: any;
}

/** ---- State ---- */
export interface ExtendReservationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  item: ExtendReservationItem | null;
  lastPayload: Partial<ExtendReservationPayload> | null;
}

const initialState: ExtendReservationState = {
  loading: false,
  error: null,
  success: false,
  item: null,
  lastPayload: null,
};

/** ---- Thunk: POST /api/extend ---- */
export const extendReservation = createAsyncThunk<
  ExtendReservationItem,
  ExtendReservationPayload,
  { rejectValue: string }
>("extendReservation/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/extend`;
    const res = await axios.post(url, payload);
    return res.data as ExtendReservationItem;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to extend reservation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const extendReservationSlice = createSlice({
  name: "extendReservation",
  initialState,
  reducers: {
    // ✅ named to match your import in ExtendDrawer
    resetExtendReservationState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.item = null;
      state.lastPayload = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(extendReservation.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastPayload = action.meta.arg ?? null;
      })
      .addCase(
        extendReservation.fulfilled,
        (state, action: PayloadAction<ExtendReservationItem>) => {
          state.loading = false;
          state.item = action.payload ?? null;
          state.success = true;
        }
      )
      .addCase(extendReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to extend reservation.";
      });
  },
});

export const { resetExtendReservationState } = extendReservationSlice.actions;
export default extendReservationSlice.reducer;

/** ---- Selectors ---- */
export const selectExtendReservationLoading = (s: any) =>
  (s.extendReservation?.loading as boolean) ?? false;

export const selectExtendReservationError = (s: any) =>
  (s.extendReservation?.error as string | null) ?? null;

export const selectExtendReservationSuccess = (s: any) =>
  (s.extendReservation?.success as boolean) ?? false;

export const selectExtendReservationItem = (s: any) =>
  (s.extendReservation?.item as ExtendReservationItem | null) ?? null;