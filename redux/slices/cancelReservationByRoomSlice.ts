// src/redux/slices/cancelReservationByRoomSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type CancelReservationPayload = {
  reservationId?: number | string;
  reservationDetailId: number;
  reservationStatusId?: number | string;
  status: "Cancelled" | string;
  cancelReason: string;
  cancelledBy: string;
  cancelledOn: string; // ISO string
};

type CancelReservationState = {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastResponse?: any;
};

const initialState: CancelReservationState = {
  loading: false,
  error: null,
  success: false,
};

// Thunk (kept as `cancelReservation` to match your component usage)
export const cancelReservation = createAsyncThunk<
  any,
  CancelReservationPayload,
  { rejectValue: string }
>("reservations/cancelReservation", async (payload, { rejectWithValue }) => {
  try {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("hotelmateTokens")
        : null;
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    if (!accessToken) return rejectWithValue("Not authenticated");

    const {
      reservationDetailId,
      status,
      cancelReason,
      cancelledBy,
      cancelledOn,
      reservationId,
      reservationStatusId,
    } = payload;

    const body = {
      reservationDetailId,
      reservationId,
      reservationStatusId,
      status,
      cancelReason,
      cancelledBy,
      cancelledOn,
    };

    const url = `${BASE_URL}/api/Reservation/Cancel/room/${reservationDetailId}`;

    const { data } = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Unknown error";
    return rejectWithValue(typeof msg === "string" ? msg : "Unknown error");
  }
});

// Slice variable named exactly as you requested:
const cancelReservationByRoomSlice = createSlice({
  name: "cancelReservationByRoom",
  initialState,
  reducers: {
    resetCancelReservationState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.lastResponse = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cancelReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        cancelReservation.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.lastResponse = action.payload;
        }
      )
      .addCase(cancelReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to cancel reservation";
      });
  },
});

export const { resetCancelReservationState } =
  cancelReservationByRoomSlice.actions;
export default cancelReservationByRoomSlice.reducer;
