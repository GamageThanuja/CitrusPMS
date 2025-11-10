import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface EventTypeMas {
  eventTypeID: number;
  eventType: string;
}

interface CreateEventTypeMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: EventTypeMas | null;
}

const initialState: CreateEventTypeMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: POST /api/EventTypeMas ---- */
export const createEventTypeMas = createAsyncThunk<
  EventTypeMas,
  Omit<EventTypeMas, "eventTypeID">,
  { rejectValue: string }
>("eventTypeMas/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/EventTypeMas`, payload);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create event type master.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createEventTypeMasSlice = createSlice({
  name: "createEventTypeMas",
  initialState,
  reducers: {
    resetCreateEventTypeMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEventTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createEventTypeMas.fulfilled,
        (state, action: PayloadAction<EventTypeMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(createEventTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create event type master.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateEventTypeMasState } = createEventTypeMasSlice.actions;
export default createEventTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateEventTypeMasLoading = (state: any) =>
  (state.createEventTypeMas?.loading as boolean) ?? false;
export const selectCreateEventTypeMasError = (state: any) =>
  (state.createEventTypeMas?.error as string | null) ?? null;
export const selectCreateEventTypeMasSuccess = (state: any) =>
  (state.createEventTypeMas?.success as boolean) ?? false;
export const selectCreateEventTypeMasData = (state: any) =>
  (state.createEventTypeMas?.data as EventTypeMas) ?? null;
