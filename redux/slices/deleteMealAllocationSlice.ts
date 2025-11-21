import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface DeleteMealAllocationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/** ---- Initial State ---- */
const initialState: DeleteMealAllocationState = {
  loading: false,
  error: null,
  success: false,
};

/** ---- Thunk: DELETE /api/MealAllocation/{hotelCode} ---- */
export const deleteMealAllocation = createAsyncThunk<
  { hotelCode: string; id: number },
  { hotelCode: string; id: number },
  { rejectValue: string }
>("mealAllocation/delete", async ({ hotelCode, id }, { rejectWithValue }) => {
  try {
    if (!hotelCode) {
      return rejectWithValue("Hotel Code is required for deleting meal allocation.");
    }

    if (!id) {
      return rejectWithValue("ID is required for deleting meal allocation.");
    }

    const url = `${API_BASE_URL}/api/MealAllocation/${hotelCode}`;
    await axios.delete(url);
    return { hotelCode, id };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to delete Meal Allocation.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const deleteMealAllocationSlice = createSlice({
  name: "deleteMealAllocation",
  initialState,
  reducers: {
    clearDeleteMealAllocation(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteMealAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteMealAllocation.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deleteMealAllocation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to delete Meal Allocation.";
      });
  },
});

export const { clearDeleteMealAllocation } = deleteMealAllocationSlice.actions;
export default deleteMealAllocationSlice.reducer;

/** ---- Selectors ---- */
export const selectDeleteMealAllocationLoading = (s: any) =>
  (s.deleteMealAllocation?.loading as boolean) ?? false;

export const selectDeleteMealAllocationError = (s: any) =>
  (s.deleteMealAllocation?.error as string | null) ?? null;

export const selectDeleteMealAllocationSuccess = (s: any) =>
  (s.deleteMealAllocation?.success as boolean) ?? false;