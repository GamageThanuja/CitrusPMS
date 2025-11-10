import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { MealAllocationItem } from "./fetchMealAllocationSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface UpdateMealAllocationPayload {
  id: number;
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

export interface UpdateMealAllocationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: MealAllocationItem | null;
}

/** ---- Initial State ---- */
const initialState: UpdateMealAllocationState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/MealAllocation/{hotelCode} ---- */
export const updateMealAllocation = createAsyncThunk<
  MealAllocationItem,
  UpdateMealAllocationPayload,
  { rejectValue: string }
>("mealAllocation/update", async (payload, { rejectWithValue }) => {
  try {
    if (!payload.hotelCode) {
      return rejectWithValue("Hotel Code is required for updating meal allocation.");
    }

    const url = `${API_BASE_URL}/api/MealAllocation/${payload.hotelCode}`;
    const res = await axios.put(url, payload);
    return res.data as MealAllocationItem;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to update Meal Allocation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateMealAllocationSlice = createSlice({
  name: "updateMealAllocation",
  initialState,
  reducers: {
    clearUpdateMealAllocation(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateMealAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateMealAllocation.fulfilled,
        (state, action: PayloadAction<MealAllocationItem>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateMealAllocation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update Meal Allocation.";
      });
  },
});

export const { clearUpdateMealAllocation } = updateMealAllocationSlice.actions;
export default updateMealAllocationSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateMealAllocationLoading = (s: any) =>
  (s.updateMealAllocation?.loading as boolean) ?? false;

export const selectUpdateMealAllocationError = (s: any) =>
  (s.updateMealAllocation?.error as string | null) ?? null;

export const selectUpdateMealAllocationSuccess = (s: any) =>
  (s.updateMealAllocation?.success as boolean) ?? false;

export const selectUpdatedMealAllocation = (s: any) =>
  (s.updateMealAllocation?.data as MealAllocationItem | null) ?? null;
