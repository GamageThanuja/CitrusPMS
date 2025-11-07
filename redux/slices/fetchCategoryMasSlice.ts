// src/redux/slices/fetchCategoryMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface CategoryMasItem {
  finAct: boolean;
  companyID: number;
  categoryID: number;
  categoryCode: string;
  categoryName: string;
  departmentID: number;
  createdOn: string;   // ISO
  lastModOn: string;   // ISO
  lastModBy: number;
  categoryTypeID: number;
  d30CreditMargine: number;
  d60CreditMargine: number;
  pcpCode: string;
  buid: number;
  seq: number;
  discountID: number;
  colourCode: string;
  // allow extra props gracefully
  [k: string]: any;
}

/** ---- State ---- */
export interface FetchCategoryMasState {
  loading: boolean;
  error: string | null;
  items: CategoryMasItem[];
  success: boolean;
}

const initialState: FetchCategoryMasState = {
  loading: false,
  error: null,
  items: [],
  success: false,
};

function normalizeArray(res: any): CategoryMasItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as CategoryMasItem[];
  if (typeof res === "object") return [res as CategoryMasItem];
  return [];
}

/** ---- Thunk: GET /api/CategoryMas ---- */
export const fetchCategoryMas = createAsyncThunk<
  CategoryMasItem[],
  void,
  { rejectValue: string }
>("categoryMas/fetchAll", async (_: void, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/CategoryMas`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch CategoryMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchCategoryMasSlice = createSlice({
  name: "categoryMas",
  initialState,
  reducers: {
    clearCategoryMas(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchCategoryMas.fulfilled,
        (state, action: PayloadAction<CategoryMasItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchCategoryMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to fetch CategoryMas.";
      });
  },
});

export const { clearCategoryMas } = fetchCategoryMasSlice.actions;
export default fetchCategoryMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCategoryMasItems = (s: any) =>
  (s.fetchCategoryMas?.items as CategoryMasItem[]) ?? [];

export const selectCategoryMasLoading = (s: any) =>
  (s.fetchCategoryMas?.loading as boolean) ?? false;

export const selectCategoryMasError = (s: any) =>
  (s.fetchCategoryMas?.error as string | null) ?? null;

export const selectCategoryMasSuccess = (s: any) =>
  (s.fetchCategoryMas?.success as boolean) ?? false;
