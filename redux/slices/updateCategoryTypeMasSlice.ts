import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CategoryTypeMas {
  categoryTypeID: number;
  categoryType: string;
}

/** ---- State ---- */
interface UpdateCategoryTypeMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: CategoryTypeMas | null;
}

const initialState: UpdateCategoryTypeMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/CategoryTypeMas/{categoryTypeId} ---- */
export const updateCategoryTypeMas = createAsyncThunk<
  CategoryTypeMas,
  CategoryTypeMas,
  { rejectValue: string }
>("categoryTypeMas/update", async (payload, { rejectWithValue }) => {
  try {
    const { categoryTypeID, categoryType } = payload;
    const response = await axios.put(
      `${API_BASE_URL}/api/CategoryTypeMas/${categoryTypeID}`,
      { categoryTypeID, categoryType }
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update category type.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateCategoryTypeMasSlice = createSlice({
  name: "updateCategoryTypeMas",
  initialState,
  reducers: {
    resetUpdateCategoryTypeMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateCategoryTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateCategoryTypeMas.fulfilled,
        (state, action: PayloadAction<CategoryTypeMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateCategoryTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update category type.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateCategoryTypeMasState } =
  updateCategoryTypeMasSlice.actions;
export default updateCategoryTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateCategoryTypeMasLoading = (state: any) =>
  (state.updateCategoryTypeMas?.loading as boolean) ?? false;
export const selectUpdateCategoryTypeMasError = (state: any) =>
  (state.updateCategoryTypeMas?.error as string | null) ?? null;
export const selectUpdateCategoryTypeMasSuccess = (state: any) =>
  (state.updateCategoryTypeMas?.success as boolean) ?? false;
export const selectUpdateCategoryTypeMasData = (state: any) =>
  (state.updateCategoryTypeMas?.data as CategoryTypeMas) ?? null;
