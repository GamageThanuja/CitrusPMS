

// src/redux/slices/fetchMealAllocationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface MealAllocationItem {
  id: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  currency: string;
  ai: number;
  hotelCode: string;
  createdBy: string;
  createdOn: string; // ISO
  lastUpdatedBy: string;
  lastUpdatedOn: string; // ISO
  [k: string]: any;
}

/** ---- State ---- */
export interface FetchMealAllocationState {
  loading: boolean;
  error: string | null;
  items: MealAllocationItem[];
  success: boolean;
}

const initialState: FetchMealAllocationState = {
  loading: false,
  error: null,
  items: [],
  success: false,
};

function normalizeArray(res: any): MealAllocationItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as MealAllocationItem[];
  if (typeof res === "object") return [res as MealAllocationItem];
  return [];
}

/** ---- Thunk: GET /api/MealAllocation?hotelCode= ---- */
export interface FetchMealAllocationParams {
  hotelCode?: string;
}

export const fetchMealAllocation = createAsyncThunk<
  MealAllocationItem[],
  FetchMealAllocationParams | void,
  { rejectValue: string }
>("mealAllocation/fetchAll", async (params = {}, { rejectWithValue }) => {
  try {
    const hotelCode = (params as FetchMealAllocationParams | undefined)?.hotelCode;
    const qs = new URLSearchParams();
    if (hotelCode) qs.append("hotelCode", hotelCode);

    const url = `${API_BASE_URL}/api/MealAllocation${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch MealAllocation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchMealAllocationSlice = createSlice({
  name: "mealAllocation",
  initialState,
  reducers: {
    clearMealAllocation(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMealAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchMealAllocation.fulfilled,
        (state, action: PayloadAction<MealAllocationItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchMealAllocation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch MealAllocation.";
      });
  },
});

export const { clearMealAllocation } = fetchMealAllocationSlice.actions;
export default fetchMealAllocationSlice.reducer;

/** ---- Selectors ---- */
export const selectMealAllocationItems = (s: any) =>
  (s.fetchMealAllocation?.items as MealAllocationItem[]) ?? [];

export const selectMealAllocationLoading = (s: any) =>
  (s.fetchMealAllocation?.loading as boolean) ?? false;

export const selectMealAllocationError = (s: any) =>
  (s.fetchMealAllocation?.error as string | null) ?? null;

export const selectMealAllocationSuccess = (s: any) =>
  (s.fetchMealAllocation?.success as boolean) ?? false;