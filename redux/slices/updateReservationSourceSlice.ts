// redux/slices/updateReservationSourceSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ReservationSource {
  reservationSourceID: number;
  reservationSource: string;
}

interface UpdateReservationSourceState {
  loading: boolean;
  error: string | null;
  data: ReservationSource | null;
}

const initialState: UpdateReservationSourceState = {
  loading: false,
  error: null,
  data: null,
};

/** ---- Thunk: PUT /api/ReservationSource/{id} ---- */
export const updateReservationSource = createAsyncThunk<
  ReservationSource,
  { id: number; reservationSource: string },
  { rejectValue: string }
>("reservationSource/update", async ({ id, reservationSource }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/ReservationSource/${id}`, {
      reservationSourceID: id,
      reservationSource,
    });
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to update reservation source.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateReservationSourceSlice = createSlice({
  name: "updateReservationSource",
  initialState,
  reducers: {
    resetUpdateReservationSourceState(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateReservationSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateReservationSource.fulfilled,
        (state, action: PayloadAction<ReservationSource>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateReservationSource.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to update reservation source.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateReservationSourceState } =
  updateReservationSourceSlice.actions;
export default updateReservationSourceSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateReservationSourceLoading = (state: any) =>
  state.updateReservationSource?.loading ?? false;
export const selectUpdateReservationSourceError = (state: any) =>
  state.updateReservationSource?.error ?? null;
export const selectUpdateReservationSourceData = (state: any) =>
  state.updateReservationSource?.data ?? null;
