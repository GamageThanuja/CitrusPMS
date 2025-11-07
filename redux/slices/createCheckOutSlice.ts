

// src/redux/slices/createCheckOutSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API query params) ---- */
export interface CreateCheckOutParams {
  /** Required by API */
  reservationDetailId: number | string;
  /** Required by API */
  roomId: number | string;
  /** Optional: if omitted we try localStorage -> fallback */
  username?: string;
}

export interface CreateCheckOutState {
  loading: boolean;
  error: string | null;
  data: any | null;
  success: boolean;
  lastParams: CreateCheckOutParams | null;
}

const initialState: CreateCheckOutState = {
  loading: false,
  error: null,
  data: null,
  success: false,
  lastParams: null,
};

function normalizeResponse(res: any): any | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? res[0] : null;
  if (typeof res === "object") return res;
  return null;
}

/** ---- Thunk: POST /api/Checkout (query params only) ---- */
export const createCheckOut = createAsyncThunk<
  any | null,
  CreateCheckOutParams,
  { rejectValue: string }
>("checkOut/create", async (params, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/Checkout`;

    const { username, reservationDetailId, roomId } = params || ({} as CreateCheckOutParams);

    // Username priority: explicit -> localStorage -> default
    const fromLocal =
      typeof window !== "undefined" &&
      (localStorage.getItem("rememberedUsername") || "").trim();

    // Ensure numbers (axios omits undefined)
    const parsedReservationDetailId =
      typeof reservationDetailId === "number"
        ? reservationDetailId
        : Number.isFinite(Number(reservationDetailId))
        ? Number(reservationDetailId)
        : undefined;

    const parsedRoomId =
      typeof roomId === "number"
        ? roomId
        : Number.isFinite(Number(roomId))
        ? Number(roomId)
        : undefined;

    const res = await axios.post(url, null, {
      params: {
        username: (username ?? fromLocal) || "hotelmate.dev@gmail.com",
        reservationDetailId: parsedReservationDetailId,
        roomId: parsedRoomId,
      },
    });

    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to checkout.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createCheckOutSlice = createSlice({
  name: "createCheckOut",
  initialState,
  reducers: {
    clearCreateCheckOut(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
      state.success = false;
      state.lastParams = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheckOut.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastParams = action.meta.arg ?? null;
      })
      .addCase(
        createCheckOut.fulfilled,
        (state, action: PayloadAction<any | null>) => {
          state.loading = false;
          state.data = action.payload;
          state.success = true;
        }
      )
      .addCase(createCheckOut.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to checkout.";
      });
  },
});

export const { clearCreateCheckOut } = createCheckOutSlice.actions;
export default createCheckOutSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateCheckOutData = (s: any) =>
  (s.createCheckOut?.data as any) ?? null;
export const selectCreateCheckOutLoading = (s: any) =>
  (s.createCheckOut?.loading as boolean) ?? false;
export const selectCreateCheckOutError = (s: any) =>
  (s.createCheckOut?.error as string | null) ?? null;
export const selectCreateCheckOutSuccess = (s: any) =>
  (s.createCheckOut?.success as boolean) ?? false;