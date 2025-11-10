import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface EventTypeMas {
  eventTypeID: number;
  eventType: string;
}

/** ---- State ---- */
interface UpdateEventTypeMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: EventTypeMas | null;
}

const initialState: UpdateEventTypeMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/EventTypeMas/{id} ---- */
export const updateEventTypeMas = createAsyncThunk<
  EventTypeMas,
  EventTypeMas,
  { rejectValue: string }
>("eventTypeMas/update", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/EventTypeMas/${payload.eventTypeID}`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update EventTypeMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateEventTypeMasSlice = createSlice({
  name: "updateEventTypeMas",
  initialState,
  reducers: {
    resetUpdateEventTypeMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateEventTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateEventTypeMas.fulfilled,
        (state, action: PayloadAction<EventTypeMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateEventTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update EventTypeMas.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateEventTypeMasState } =
  updateEventTypeMasSlice.actions;
export default updateEventTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateEventTypeMasLoading = (state: any) =>
  (state.updateEventTypeMas?.loading as boolean) ?? false;
export const selectUpdateEventTypeMasError = (state: any) =>
  (state.updateEventTypeMas?.error as string | null) ?? null;
export const selectUpdateEventTypeMasSuccess = (state: any) =>
  (state.updateEventTypeMas?.success as boolean) ?? false;
export const selectUpdateEventTypeMasData = (state: any) =>
  (state.updateEventTypeMas?.data as EventTypeMas | null) ?? null;
