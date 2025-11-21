// src/redux/slices/shortenReservationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Request payload (aligns with /api/shorten body) ---- */
export interface ShortenReservationPayload {
  reservationDetailId: number;
  reservationMasterId: number;
  roomId: number;
  newCheckOutDate: string; // ISO string
  oldCheckOutDate: string; // ISO string
}

/** ---- Response type (adjust to real API if you know it) ---- */
export interface ShortenReservationResponse {
  success?: boolean;
  message?: string;
  status?: string;
  [k: string]: any;
}

/** ---- State ---- */
export interface ShortenReservationState {
  loading: boolean;
  error: string | null;
  item: ShortenReservationResponse | null;
  success: boolean;
  lastUpdatedAt: string | null;
}

const initialState: ShortenReservationState = {
  loading: false,
  error: null,
  item: null,
  success: false,
  lastUpdatedAt: null,
};

function normalizeObject(res: any): ShortenReservationResponse | null {
  if (!res) return null;
  if (Array.isArray(res)) return (res[0] as ShortenReservationResponse) ?? null;
  if (typeof res === "object") return res as ShortenReservationResponse;
  return null;
}

/** ---- Thunk: POST /api/shorten ---- */
export const shortenReservation = createAsyncThunk<
  ShortenReservationResponse | null,
  ShortenReservationPayload,
  { rejectValue: string }
>("shortenReservation/shorten", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/shorten`;
    const res = await axios.post(url, payload);
    return normalizeObject(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to shorten reservation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const shortenReservationSlice = createSlice({
  name: "shortenReservation",
  initialState,
  reducers: {
    clearShortenReservation(state) {
      state.loading = false;
      state.error = null;
      state.item = null;
      state.success = false;
      state.lastUpdatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(shortenReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        shortenReservation.fulfilled,
        (state, action: PayloadAction<ShortenReservationResponse | null>) => {
          state.loading = false;
          state.item = action.payload ?? null;
          state.success = true;
          state.lastUpdatedAt = new Date().toISOString();
        }
      )
      .addCase(shortenReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ||
          "Failed to shorten reservation.";
      });
  },
});

export const { clearShortenReservation } = shortenReservationSlice.actions;
export default shortenReservationSlice.reducer;

/** ---- Selectors ---- */
export const selectShortenReservationItem = (s: any) =>
  (s.shortenReservation?.item as ShortenReservationResponse | null) ?? null;

export const selectShortenReservationLoading = (s: any) =>
  (s.shortenReservation?.loading as boolean) ?? false;

export const selectShortenReservationError = (s: any) =>
  (s.shortenReservation?.error as string | null) ?? null;

export const selectShortenReservationSuccess = (s: any) =>
  (s.shortenReservation?.success as boolean) ?? false;

export const selectShortenReservationLastUpdatedAt = (s: any) =>
  (s.shortenReservation?.lastUpdatedAt as string | null) ?? null;