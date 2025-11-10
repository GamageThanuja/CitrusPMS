import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { MealAllocationItem } from "./fetchMealAllocationSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CreateMealAllocationPayload {
  id?: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  currency: string;
  ai: number;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
}

export interface CreateMealAllocationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: MealAllocationItem | null;
}

/** ---- Initial State ---- */
const initialState: CreateMealAllocationState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: POST /api/MealAllocation ---- */
export const createMealAllocation = createAsyncThunk<
  MealAllocationItem,
  CreateMealAllocationPayload,
  { rejectValue: string }
>("mealAllocation/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/MealAllocation`;
    const res = await axios.post(url, payload);
    return res.data as MealAllocationItem;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create Meal Allocation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createMealAllocationSlice = createSlice({
  name: "createMealAllocation",
  initialState,
  reducers: {
    clearCreateMealAllocation(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMealAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createMealAllocation.fulfilled,
        (state, action: PayloadAction<MealAllocationItem>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(createMealAllocation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create Meal Allocation.";
      });
  },
});

export const { clearCreateMealAllocation } = createMealAllocationSlice.actions;
export default createMealAllocationSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateMealAllocationLoading = (s: any) =>
  (s.createMealAllocation?.loading as boolean) ?? false;

export const selectCreateMealAllocationError = (s: any) =>
  (s.createMealAllocation?.error as string | null) ?? null;

export const selectCreateMealAllocationSuccess = (s: any) =>
  (s.createMealAllocation?.success as boolean) ?? false;

export const selectCreatedMealAllocation = (s: any) =>
  (s.createMealAllocation?.data as MealAllocationItem | null) ?? null;
