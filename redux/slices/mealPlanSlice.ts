import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface MealPlan {
  mealPlanID: number;
  mealPlan: string;
  breakFast: boolean;
  lunch: boolean;
  dinner: boolean;
  ai: boolean;
  shortCode: string;
}

interface MealPlanState {
  data: MealPlan[];
  loading: boolean;
  error: string | null;
}

const initialState: MealPlanState = {
  data: [],
  loading: false,
  error: null,
};

// Async thunk to fetch meal plans
export const fetchMealPlans = createAsyncThunk(
  "mealPlan/fetchMealPlans",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<MealPlan[]>(`${BASE_URL}/api/MealPlan`, {
        headers: {
          Accept: "text/plain",
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const mealPlanSlice = createSlice({
  name: "mealPlan",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMealPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMealPlans.fulfilled,
        (state, action: PayloadAction<MealPlan[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchMealPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default mealPlanSlice.reducer;
