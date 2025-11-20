// src/redux/slices/noShowReservationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (API request/response) ---- */
export interface NoShowReservationPayload {
  reservationDetailId: number; // used in path AND body
  isChargable: boolean;
  currencyCode: string;
  amount: number;
  tranTypeId: number;
  drAccId: number;
  crAccId: number;
  checkInDate: string; // ISO datetime
}

export interface NoShowReservationResponse {
  reservationDetailId: number;
  isChargable: boolean;
  currencyCode: string;
  amount: number;
  tranTypeId: number;
  drAccId: number;
  crAccId: number;
  checkInDate: string; // ISO datetime
  [k: string]: any;
}

/** ---- State ---- */
interface NoShowState {
  loading: boolean;
  error: string | null;
  data: NoShowReservationResponse | null;
}

const initialState: NoShowState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: PUT /api/NoShow/{reservationDetailId} ---- */
export const noShowReservation = createAsyncThunk<
  NoShowReservationResponse,
  NoShowReservationPayload,
  { rejectValue: string }
>("noShowReservation/markAsNoShow", async (payload, { rejectWithValue }) => {
  try {
    // ✅ keep reservationDetailId in the body as well
    const res = await axios.put(
      `${API_BASE_URL}/api/NoShow/${payload.reservationDetailId}`,
      payload
    );

    return res.data as NoShowReservationResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to mark reservation as No-Show.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const noShowSlice = createSlice({
  name: "noShowReservation",
  initialState,
  reducers: {
    clearNoShowState(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(noShowReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        noShowReservation.fulfilled,
        (state, action: PayloadAction<NoShowReservationResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(noShowReservation.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to mark reservation as No-Show.";
      });
  },
});

export const { clearNoShowState } = noShowSlice.actions;
export default noShowSlice.reducer;

export const selectNoShowLoading = (state: any) =>
  (state.noShowReservation?.loading as boolean) ?? false;
export const selectNoShowError = (state: any) =>
  (state.noShowReservation?.error as string | null) ?? null;
export const selectNoShowData = (state: any) =>
  (state.noShowReservation?.data as NoShowReservationResponse | null) ?? null;