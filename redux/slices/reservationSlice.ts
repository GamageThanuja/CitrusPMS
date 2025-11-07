import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ReservationData {
  status?: string;
  reservationID?: number;
  reservationDetailID?: number;
  // Add other reservation properties as needed
}

interface ReservationState {
  data: ReservationData | null;
  loading: boolean;
  error: string | null;
  cancelLoading: boolean;
  cancelError: string | null;
  cancelSuccess: boolean;
}

interface CancelRoomReservationPayload {
  reservationDetailId: number;
  reservationStatusId: number;
  status: string;
  cancelReason: string;
  cancelledBy: string;
  cancelledOn: string;
  reservationStatusColour: string;
}

interface MarkAsNoShowResponse {
  message: string;
}

interface CancelRoomResponse {
  message: string;
  // Add other response fields as needed
}

export type NoShowArgs = {
  reservationDetailId: number;
  reason?: string;
  withSurcharges?: boolean;
  amount?: number;
  currency?: string;
  updatedBy?: string;
};

// Async thunk
export const fetchReservationById = createAsyncThunk(
  "reservation/fetchReservationById",
  async (reservationId, thunkAPI) => {
    try {
      // Get token from localStorage
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;

      if (!accessToken) {
        return thunkAPI.rejectWithValue("Access token not found");
      }

      const response = await axios.get(
        `${BASE_URL}/api/Reservation/${reservationId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "text/plain",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || "Something went wrong"
      );
    }
  }
);

// Async thunk for marking a reservation as No Show
export const markReservationAsNoShow = createAsyncThunk<
  NoShowTxnResponse,
  MarkNoShowArgs,
  { rejectValue: string }
>("reservation/markAsNoShow", async (args, { rejectWithValue }) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens?.accessToken;
    if (!accessToken) return rejectWithValue("Access token not found");

    const {
      reservationDetailId,
      withSurcharges,
      amount,
      currency,
      checkInDateISO,
      drAccId = 0, // TODO: inject real account ids
      crAccId = 0, // TODO: inject real account ids
    } = args;

    const payload = {
      reservationDetailId,
      isChargable: !!withSurcharges,
      currencyCode: withSurcharges ? currency || "" : "",
      amount: withSurcharges ? amount ?? 0 : 0,
      tranTypeId: withSurcharges ? 7 : 6, // 👈 key part
      drAccId,
      crAccId,
      checkInDate: checkInDateISO || new Date().toISOString(),
    };

    // If your API uses PUT /Reservation/NoShow/{id}, keep it.
    // If it uses a different route (e.g. /Transaction/NoShow), point to that.
    const res = await axios.put(
      `${BASE_URL}/api/Reservation/NoShow/${reservationDetailId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("No-Show error details:", {
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
      body: error?.config?.data,
    });
    const msg =
      error?.response?.data?.message ||
      error?.response?.data ||
      "Failed to mark reservation as No Show";
    return rejectWithValue(String(msg));
  }
});

// Async thunk for cancelling a room reservation
export const cancelRoomReservation = createAsyncThunk<
  CancelRoomResponse,
  Omit<CancelRoomReservationPayload, "cancelledOn"> & { cancelledBy: string },
  { rejectValue: string }
>("reservation/cancelRoom", async (payload, { rejectWithValue }) => {
  try {
    // Get token from localStorage
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens?.accessToken;

    if (!accessToken) {
      return rejectWithValue("Access token not found");
    }

    const requestPayload: CancelRoomReservationPayload = {
      ...payload,
      cancelledOn: new Date().toISOString(),
    };

    const response = await axios.put(
      `${BASE_URL}/api/Reservation/Cancel/room/${payload.reservationDetailId}`,
      requestPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error cancelling room reservation:", error);
    return rejectWithValue(
      error.response?.data?.message || "Failed to cancel room reservation"
    );
  }
});

const initialState: ReservationState = {
  data: null,
  loading: false,
  error: null,
  cancelLoading: false,
  cancelError: null,
  cancelSuccess: false,
};

const reservationSlice = createSlice({
  name: "reservation",
  initialState,
  reducers: {
    clearReservation(state) {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
    setReservationStatus(state, action: PayloadAction<string>) {
      if (state.data) {
        state.data.status = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservationById.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReservationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markReservationAsNoShow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markReservationAsNoShow.fulfilled, (state) => {
        state.loading = false;
        // Update the local state to reflect the no-show status
        if (state.data) {
          state.data.status = "No Show";
        }
      })
      .addCase(markReservationAsNoShow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark as No Show";
      })
      .addCase(cancelRoomReservation.pending, (state) => {
        state.cancelLoading = true;
        state.cancelError = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelRoomReservation.fulfilled, (state) => {
        state.cancelLoading = false;
        state.cancelSuccess = true;
        // Update the status in the state if needed
        if (state.data) {
          state.data.status = "Cancelled";
        }
      })
      .addCase(cancelRoomReservation.rejected, (state, action) => {
        state.cancelLoading = false;
        state.cancelError = action.payload as string;
        state.cancelSuccess = false;
      });
  },
});

export const { clearReservation, setReservationStatus } =
  reservationSlice.actions;

export default reservationSlice.reducer;
