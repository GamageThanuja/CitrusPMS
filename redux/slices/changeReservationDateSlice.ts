// src/redux/slices/changeReservationDateSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */

// Request body for POST /api/change-date
export interface ChangeReservationDatePayload {
  reservationDetailId: number;
  reservationMasterId: number;
  roomId: number;
  newCheckInDate: string;   // ISO datetime string
  oldCheckInDate: string;   // ISO datetime string
  oldCheckOutDate: string;  // ISO datetime string
  newCheckOutDate: string;  // ISO datetime string
  hotelCode: number;
  rate: number;
  currencyCode: string;
  mealPlan: string;
}

// Response type – adjust to your actual API response if you know the shape
export interface ChangeReservationDateResponse {
  [k: string]: any;
}

/** ---- State ---- */
export interface ChangeReservationDateState {
  loading: boolean;
  error: string | null;
  data: ChangeReservationDateResponse | null;
  success: boolean;
  lastChangedAt: string | null; // ISO timestamp of last success
}

const initialState: ChangeReservationDateState = {
  loading: false,
  error: null,
  data: null,
  success: false,
  lastChangedAt: null,
};

function normalizeObject(res: any): ChangeReservationDateResponse | null {
  if (!res) return null;
  if (Array.isArray(res)) return (res[0] as ChangeReservationDateResponse) ?? null;
  if (typeof res === "object") return res as ChangeReservationDateResponse;
  return null;
}

/** ---- Thunk: POST /api/change-date ---- */
export const changeReservationDate = createAsyncThunk<
  ChangeReservationDateResponse | null,
  ChangeReservationDatePayload,
  { rejectValue: string; state: any }
>("reservation/changeDate", async (payload, { rejectWithValue, getState }) => {
  try {
    const url = `${API_BASE_URL}/api/change-date`;

    // If you keep selected property in Redux, override hotelCode using it
    const state = getState();
    const selectedProperty =
      state.property?.selectedProperty || state.property?.currentProperty;

    const hotelCodeFromState =
      selectedProperty?.id ??
      selectedProperty?.hotelCode ??
      payload.hotelCode ??
      0;

    const body: ChangeReservationDatePayload = {
      ...payload,
      hotelCode: Number(hotelCodeFromState) || 0,
    };

    const res = await axios.post(url, body);
    return normalizeObject(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to change reservation date.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const changeReservationDateSlice = createSlice({
  name: "changeReservationDate",
  initialState,
  reducers: {
    // name matches what the component calls: resetChangeDateState()
    resetChangeDateState(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
      state.success = false;
      state.lastChangedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changeReservationDate.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        changeReservationDate.fulfilled,
        (
          state,
          action: PayloadAction<ChangeReservationDateResponse | null>
        ) => {
          state.loading = false;
          state.data = action.payload ?? null;
          state.success = true;
          state.lastChangedAt = new Date().toISOString();
        }
      )
      .addCase(changeReservationDate.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ||
          "Failed to change reservation date.";
      });
  },
});

export const { resetChangeDateState } = changeReservationDateSlice.actions;
export default changeReservationDateSlice.reducer;

/** ---- Selectors ---- */
export const selectChangeReservationDateData = (s: any) =>
  (s.changeReservationDate?.data as ChangeReservationDateResponse | null) ??
  null;
export const selectChangeReservationDateLoading = (s: any) =>
  (s.changeReservationDate?.loading as boolean) ?? false;
export const selectChangeReservationDateError = (s: any) =>
  (s.changeReservationDate?.error as string | null) ?? null;
export const selectChangeReservationDateSuccess = (s: any) =>
  (s.changeReservationDate?.success as boolean) ?? false;
export const selectChangeReservationDateLastChangedAt = (s: any) =>
  (s.changeReservationDate?.lastChangedAt as string | null) ?? null;