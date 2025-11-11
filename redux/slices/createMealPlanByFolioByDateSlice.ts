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
interface CreateMealPlanByFolioByDateState {
  loading: boolean;
  success: boolean;
  data: MealPlanByFolioByDate | null;
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: CreateMealPlanByFolioByDateState = {
  loading: false,
  success: false,
  data: null,
  error: null,
};

/** ---- Thunk: POST /api/MealPlanByFolioByDate ---- */
export const createMealPlanByFolioByDate = createAsyncThunk<
  MealPlanByFolioByDate,
  MealPlanByFolioByDate,
  { rejectValue: string }
>("mealPlanByFolioByDate/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/MealPlanByFolioByDate`;

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
    });

    return response.data as MealPlanByFolioByDate;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create meal plan by folio by date.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createMealPlanByFolioByDateSlice = createSlice({
  name: "createMealPlanByFolioByDate",
  initialState,
  reducers: {
    resetCreateMealPlanByFolioByDate(state) {
      state.loading = false;
      state.success = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMealPlanByFolioByDate.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        createMealPlanByFolioByDate.fulfilled,
        (state, action: PayloadAction<MealPlanByFolioByDate>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(createMealPlanByFolioByDate.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ??
          "Failed to create meal plan by folio by date.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateMealPlanByFolioByDate } =
  createMealPlanByFolioByDateSlice.actions;
export default createMealPlanByFolioByDateSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateMealPlanByFolioByDateData = (state: any) =>
  (state.createMealPlanByFolioByDate?.data as MealPlanByFolioByDate | null) ??
  null;

export const selectCreateMealPlanByFolioByDateLoading = (state: any) =>
  (state.createMealPlanByFolioByDate?.loading as boolean) ?? false;

export const selectCreateMealPlanByFolioByDateSuccess = (state: any) =>
  (state.createMealPlanByFolioByDate?.success as boolean) ?? false;

export const selectCreateMealPlanByFolioByDateError = (state: any) =>
  (state.createMealPlanByFolioByDate?.error as string | null) ?? null;
