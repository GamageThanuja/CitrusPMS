

// src/redux/slices/createCategoryMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface CreateCategoryMasPayload {
  finAct?: boolean | null;
  companyID?: number | null;
  categoryID?: number | null;
  categoryCode?: string | null;
  categoryName: string; // required for UX validation
  departmentID?: number | null;
  createdOn?: string | null;   // ISO
  lastModOn?: string | null;   // ISO
  lastModBy?: number | null;
  categoryTypeID?: number | null;
  d30CreditMargine?: number | null;
  d60CreditMargine?: number | null;
  pcpCode?: string | null;
  buid?: number | null;
  seq?: number | null;
  discountID?: number | null;
  colourCode?: string | null;
  [k: string]: any;
}

export interface CategoryMasItem {
  finAct: boolean | null;
  companyID: number | null;
  categoryID: number;
  categoryCode: string | null;
  categoryName: string;
  departmentID: number | null;
  createdOn: string | null;
  lastModOn: string | null;
  lastModBy: number | null;
  categoryTypeID: number | null;
  d30CreditMargine: number | null;
  d60CreditMargine: number | null;
  pcpCode: string | null;
  buid: number | null;
  seq: number | null;
  discountID: number | null;
  colourCode: string | null;
  [k: string]: any;
}

/** ---- State ---- */
export interface CreateCategoryMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  item: CategoryMasItem | null;
  lastPayload: Partial<CreateCategoryMasPayload> | null;
}

const initialState: CreateCategoryMasState = {
  loading: false,
  error: null,
  success: false,
  item: null,
  lastPayload: null,
};

/** ---- Thunk: POST /api/CategoryMas ---- */
export const createCategoryMas = createAsyncThunk<
  CategoryMasItem,
  CreateCategoryMasPayload,
  { rejectValue: string }
>("categoryMas/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/CategoryMas`;
    const res = await axios.post(url, payload);
    return res.data as CategoryMasItem;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create CategoryMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createCategoryMasSlice = createSlice({
  name: "createCategoryMas",
  initialState,
  reducers: {
    clearCreateCategoryMas(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.item = null;
      state.lastPayload = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCategoryMas.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastPayload = action.meta.arg ?? null;
      })
      .addCase(
        createCategoryMas.fulfilled,
        (state, action: PayloadAction<CategoryMasItem>) => {
          state.loading = false;
          state.item = action.payload ?? null;
          state.success = true;
        }
      )
      .addCase(createCategoryMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to create CategoryMas.";
      });
  },
});

export const { clearCreateCategoryMas } = createCategoryMasSlice.actions;
export default createCategoryMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateCategoryLoading = (s: any) =>
  (s.createCategoryMas?.loading as boolean) ?? false;
export const selectCreateCategoryError = (s: any) =>
  (s.createCategoryMas?.error as string | null) ?? null;
export const selectCreateCategorySuccess = (s: any) =>
  (s.createCategoryMas?.success as boolean) ?? false;
export const selectCreateCategoryItem = (s: any) =>
  (s.createCategoryMas?.item as CategoryMasItem | null) ?? null;