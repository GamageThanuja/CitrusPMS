import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface MealPlanByFolioByDate {
  recordID: number;
  folioID: number;
  dt: string; // ISO date string
  mealPlan: string;
  ai: boolean;
}

/** ---- Slice State ---- */
interface UpdateMealPlanByFolioByDateState {
  loading: boolean;
  success: boolean;
  data: MealPlanByFolioByDate | null;
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: UpdateMealPlanByFolioByDateState = {
  loading: false,
  success: false,
  data: null,
  error: null,
};

/** ---- Thunk: PUT /api/MealPlanByFolioByDate/{id} ---- */
export const updateMealPlanByFolioByDate = createAsyncThunk<
  MealPlanByFolioByDate,
  MealPlanByFolioByDate,
  { rejectValue: string }
>("mealPlanByFolioByDate/update", async (payload, { rejectWithValue }) => {
  try {
    if (!payload?.recordID) {
      return rejectWithValue("Missing recordID for update request.");
    }

    const url = `${API_BASE_URL}/api/MealPlanByFolioByDate/${payload.recordID}`;

    const response = await axios.put(url, payload, {
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
    });

    return response.data as MealPlanByFolioByDate;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update meal plan by folio by date.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateMealPlanByFolioByDateSlice = createSlice({
  name: "updateMealPlanByFolioByDate",
  initialState,
  reducers: {
    resetUpdateMealPlanByFolioByDate(state) {
      state.loading = false;
      state.success = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateMealPlanByFolioByDate.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        updateMealPlanByFolioByDate.fulfilled,
        (state, action: PayloadAction<MealPlanByFolioByDate>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateMealPlanByFolioByDate.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ??
          "Failed to update meal plan by folio by date.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateMealPlanByFolioByDate } =
  updateMealPlanByFolioByDateSlice.actions;
export default updateMealPlanByFolioByDateSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateMealPlanByFolioByDateData = (state: any) =>
  (state.updateMealPlanByFolioByDate?.data as MealPlanByFolioByDate | null) ??
  null;

export const selectUpdateMealPlanByFolioByDateLoading = (state: any) =>
  (state.updateMealPlanByFolioByDate?.loading as boolean) ?? false;

export const selectUpdateMealPlanByFolioByDateSuccess = (state: any) =>
  (state.updateMealPlanByFolioByDate?.success as boolean) ?? false;

export const selectUpdateMealPlanByFolioByDateError = (state: any) =>
  (state.updateMealPlanByFolioByDate?.error as string | null) ?? null;
