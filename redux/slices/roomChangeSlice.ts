// src/redux/slices/roomChangeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface RoomChangePayload {
  reservationDetailId: number;
  newRoomId: number;
  browserTime: string | null; // ISO string
  [k: string]: any;
}

// Relaxed response type – adjust if your API returns a specific shape
export interface RoomChangeResponse {
  reservationDetailId?: number;
  newRoomId?: number;
  browserTime?: string;
  message?: string;
  status?: string | number;
  [k: string]: any;
}

interface RoomChangeState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: RoomChangeResponse | null;
  lastPayload: RoomChangePayload | null;
}

const initialState: RoomChangeState = {
  loading: false,
  error: null,
  success: false,
  data: null,
  lastPayload: null,
};

/** ---- Thunk: PUT /api/change-room ---- */
export const changeRoom = createAsyncThunk<
  RoomChangeResponse,
  RoomChangePayload,
  { rejectValue: string }
>("roomChange/update", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/change-room`, payload);
    return response.data as RoomChangeResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to change room.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const roomChangeSlice = createSlice({
  name: "roomChange",
  initialState,
  reducers: {
    clearRoomChangeState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
      state.lastPayload = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(changeRoom.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastPayload = action.meta.arg ?? null;
      })
      .addCase(
        changeRoom.fulfilled,
        (state, action: PayloadAction<RoomChangeResponse>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload ?? null;
        }
      )
      .addCase(changeRoom.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to change room.";
      });
  },
});

/** ---- Exports ---- */
export const { clearRoomChangeState } = roomChangeSlice.actions;
export default roomChangeSlice.reducer;

/** ---- Selectors ---- */
export const selectRoomChangeLoading = (state: any) =>
  (state.roomChange?.loading as boolean) ?? false;

export const selectRoomChangeError = (state: any) =>
  (state.roomChange?.error as string | null) ?? null;

export const selectRoomChangeSuccess = (state: any) =>
  (state.roomChange?.success as boolean) ?? false;

export const selectRoomChangeData = (state: any) =>
  (state.roomChange?.data as RoomChangeResponse | null) ?? null;

export const selectRoomChangeLastPayload = (state: any) =>
  (state.roomChange?.lastPayload as RoomChangePayload | null) ?? null;