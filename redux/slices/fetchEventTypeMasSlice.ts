import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface EventTypeMas {
  eventTypeID: number;
  eventType: string;
}

/** ---- State ---- */
interface FetchEventTypeMasState {
  loading: boolean;
  error: string | null;
  data: EventTypeMas[];
}

const initialState: FetchEventTypeMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/EventTypeMas ---- */
export const fetchEventTypeMas = createAsyncThunk<
  EventTypeMas[],
  void,
  { rejectValue: string }
>("eventTypeMas/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/EventTypeMas`);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch event type master data.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchEventTypeMasSlice = createSlice({
  name: "fetchEventTypeMas",
  initialState,
  reducers: {
    resetEventTypeMasState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchEventTypeMas.fulfilled,
        (state, action: PayloadAction<EventTypeMas[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchEventTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch event type master data.";
      });
  },
});

/** ---- Exports ---- */
export const { resetEventTypeMasState } = fetchEventTypeMasSlice.actions;
export default fetchEventTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectEventTypeMasLoading = (state: any) =>
  (state.fetchEventTypeMas?.loading as boolean) ?? false;
export const selectEventTypeMasError = (state: any) =>
  (state.fetchEventTypeMas?.error as string | null) ?? null;
export const selectEventTypeMasData = (state: any) =>
  (state.fetchEventTypeMas?.data as EventTypeMas[]) ?? [];
