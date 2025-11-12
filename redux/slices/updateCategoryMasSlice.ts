// redux/slices/updateCategoryMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (mirrors API body) ---- */
export interface CategoryMas {
  finAct: boolean | null;
  companyID: number | null;
  categoryID: number | null;
  categoryCode: string;              // used in the path
  categoryName: string;
  departmentID: number | null;
  createdOn: string | null;          // ISO
  lastModOn: string | null;          // ISO
  lastModBy: number | null;
  categoryTypeID: number | null;
  d30CreditMargine: number | null;
  d60CreditMargine: number | null;
  pcpCode: string | null;
  buid: number | null;
  seq: number | null;
  discountID: number | null;
  colourCode: string | null;
  // allow extra props gracefully
  [k: string]: any;
}

/** ---- State ---- */
interface UpdateCategoryMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: CategoryMas | null;
}

const initialState: UpdateCategoryMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/CategoryMas/{categoryCode} ---- */
export const updateCategoryMas = createAsyncThunk<
  CategoryMas,
  CategoryMas,
  { rejectValue: string }
>("categoryMas/update", async (payload, { rejectWithValue }) => {
  try {
    const { categoryCode } = payload;
    const res = await axios.put(
      `${API_BASE_URL}/api/CategoryMas/${encodeURIComponent(categoryCode)}`,
      payload
    );
    return res.data as CategoryMas;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update category.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateCategoryMasSlice = createSlice({
  name: "updateCategoryMas",
  initialState,
  reducers: {
    resetUpdateCategoryMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateCategoryMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateCategoryMas.fulfilled,
        (state, action: PayloadAction<CategoryMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateCategoryMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update category.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateCategoryMasState } = updateCategoryMasSlice.actions;
export default updateCategoryMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateCategoryMasLoading = (state: any) =>
  (state.updateCategoryMas?.loading as boolean) ?? false;

export const selectUpdateCategoryMasError = (state: any) =>
  (state.updateCategoryMas?.error as string | null) ?? null;

export const selectUpdateCategoryMasSuccess = (state: any) =>
  (state.updateCategoryMas?.success as boolean) ?? false;

export const selectUpdateCategoryMasData = (state: any) =>
  (state.updateCategoryMas?.data as CategoryMas | null) ?? null;