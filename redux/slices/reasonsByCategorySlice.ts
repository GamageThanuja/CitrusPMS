// src/redux/slices/reasonsByCategorySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface ReasonItem {
  id: number;
  reason: string;
  category: string;
  // allow extra props gracefully
  [k: string]: any;
}

export interface FetchReasonsByCategoryParams {
  category: string; // path parameter – required by API
}

/** ---- State ---- */
export interface ReasonsByCategoryState {
  loading: boolean;
  error: string | null;
  items: ReasonItem[];
  success: boolean;
  lastFetchedAt: string | null; // ISO timestamp of last success
}

const initialState: ReasonsByCategoryState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

function normalizeArray(res: any): ReasonItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as ReasonItem[];
  if (typeof res === "object") return [res as ReasonItem];
  return [];
}

/** ---- Thunk: GET /api/Reasons/{category} ---- */
export const fetchReasonsByCategory = createAsyncThunk<
  ReasonItem[],
  FetchReasonsByCategoryParams,
  { rejectValue: string }
>("reasonsByCategory/fetch", async (params, { rejectWithValue }) => {
  try {
    const category = params.category || "";
    const url = `${API_BASE_URL}/api/Reasons/${encodeURIComponent(category)}`;
    console.log("Fetching reasons from:", url);

    const res = await axios.get(url);
    console.log("Reasons API response:", res.data);

    const normalized = normalizeArray(res.data);
    console.log("Normalized reasons data:", normalized);

    return normalized;
  } catch (err: any) {
    console.error("Reasons API error:", err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch reasons.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const reasonsByCategorySlice = createSlice({
  name: "reasonsByCategory",
  initialState,
  reducers: {
    clearReasonsByCategory(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReasonsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchReasonsByCategory.fulfilled,
        (state, action: PayloadAction<ReasonItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchReasonsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to fetch reasons.";
      });
  },
});

export const { clearReasonsByCategory } = reasonsByCategorySlice.actions;
export default reasonsByCategorySlice.reducer;

/** ---- Selectors ---- */
export const selectReasonsItems = (s: any) =>
  (s.reasonsByCategory?.items as ReasonItem[]) ?? [];

export const selectReasonsLoading = (s: any) =>
  (s.reasonsByCategory?.loading as boolean) ?? false;

export const selectReasonsError = (s: any) =>
  (s.reasonsByCategory?.error as string | null) ?? null;

export const selectReasonsSuccess = (s: any) =>
  (s.reasonsByCategory?.success as boolean) ?? false;

export const selectReasonsLastFetchedAt = (s: any) =>
  (s.reasonsByCategory?.lastFetchedAt as string | null) ?? null;