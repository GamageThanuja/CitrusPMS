import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface MealPlanByFolioByDate {
  recordID: number;
  folioID: number;
  dt: string; // date string, e.g. "2025-07-05T00:00:00"
  mealPlan: string;
  ai: boolean;
}

/** ---- Slice State ---- */
interface FetchMealPlanByFolioByDateState {
  loading: boolean;
  data: MealPlanByFolioByDate[];
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: FetchMealPlanByFolioByDateState = {
  loading: false,
  data: [],
  error: null,
};

/** ---- Thunk: GET /api/MealPlanByFolioByDate?folioId=&mealPlan= ---- */
export const fetchMealPlanByFolioByDate = createAsyncThunk<
  MealPlanByFolioByDate[],
  { folioId?: number; mealPlan?: string }, // Make parameters optional
  { rejectValue: string }
>("mealPlanByFolioByDate/fetch", async (params = {}, { rejectWithValue }) => {
  try {
    const { folioId, mealPlan } = params;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (folioId) queryParams.append('folioId', folioId.toString());
    if (mealPlan) queryParams.append('mealPlan', mealPlan);

    const url = `${API_BASE_URL}/api/MealPlanByFolioByDate${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await axios.get(url, {
      headers: { Accept: "text/plain" },
    });

    return response.data as MealPlanByFolioByDate[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch meal plan by folio by date.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchMealPlanByFolioByDateSlice = createSlice({
  name: "fetchMealPlanByFolioByDate",
  initialState,
  reducers: {
    resetMealPlanByFolioByDate(state) {
      state.loading = false;
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMealPlanByFolioByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMealPlanByFolioByDate.fulfilled,
        (state, action: PayloadAction<MealPlanByFolioByDate[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchMealPlanByFolioByDate.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          "Failed to fetch meal plan by folio by date.";
      });
  },
});

/** ---- Exports ---- */
export const { resetMealPlanByFolioByDate } =
  fetchMealPlanByFolioByDateSlice.actions;
export default fetchMealPlanByFolioByDateSlice.reducer;

/** ---- Selectors ---- */
export const selectMealPlanByFolioByDateData = (state: any) =>
  (state.fetchMealPlanByFolioByDate?.data as MealPlanByFolioByDate[]) ?? [];

export const selectMealPlanByFolioByDateLoading = (state: any) =>
  (state.fetchMealPlanByFolioByDate?.loading as boolean) ?? false;

export const selectMealPlanByFolioByDateError = (state: any) =>
  (state.fetchMealPlanByFolioByDate?.error as string | null) ?? null;