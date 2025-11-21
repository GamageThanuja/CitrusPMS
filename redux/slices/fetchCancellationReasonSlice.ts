// src/redux/slices/fetchCancellationReasonSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface CancellationReasonItem {
  id: number;
  reason: string;
  // allow extra props gracefully
  [k: string]: any;
}

/** ---- State ---- */
export interface FetchCancellationReasonState {
  loading: boolean;
  error: string | null;
  items: CancellationReasonItem[];
  success: boolean;
  lastFetchedAt: string | null; // ISO timestamp of last success
}

const initialState: FetchCancellationReasonState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

function normalizeArray(res: any): CancellationReasonItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as CancellationReasonItem[];
  if (typeof res === "object") return [res as CancellationReasonItem];
  return [];
}

/** ---- Thunk: GET /api/CancellationReason ---- */
export const fetchCancellationReasons = createAsyncThunk<
  CancellationReasonItem[],
  void,
  { rejectValue: string }
>("cancellationReason/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/CancellationReason`;
    console.log("Fetching cancellation reasons from:", url);

    const res = await axios.get(url);
    console.log("CancellationReason API response:", res.data);

    const normalizedData = normalizeArray(res.data);
    console.log("Normalized CancellationReason data:", normalizedData);

    return normalizedData;
  } catch (err: any) {
    console.error("CancellationReason API error:", err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch cancellation reasons.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchCancellationReasonSlice = createSlice({
  name: "fetchCancellationReason",
  initialState,
  reducers: {
    clearCancellationReasons(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCancellationReasons.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchCancellationReasons.fulfilled,
        (state, action: PayloadAction<CancellationReasonItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchCancellationReasons.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch cancellation reasons.";
      });
  },
});

export const { clearCancellationReasons } = fetchCancellationReasonSlice.actions;
export default fetchCancellationReasonSlice.reducer;

/** ---- Selectors ---- */
export const selectCancellationReasonItems = (s: any) =>
  (s.fetchCancellationReason?.items as CancellationReasonItem[]) ?? [];

export const selectCancellationReasonLoading = (s: any) =>
  (s.fetchCancellationReason?.loading as boolean) ?? false;

export const selectCancellationReasonError = (s: any) =>
  (s.fetchCancellationReason?.error as string | null) ?? null;

export const selectCancellationReasonSuccess = (s: any) =>
  (s.fetchCancellationReason?.success as boolean) ?? false;

export const selectCancellationReasonLastFetchedAt = (s: any) =>
  (s.fetchCancellationReason?.lastFetchedAt as string | null) ?? null;