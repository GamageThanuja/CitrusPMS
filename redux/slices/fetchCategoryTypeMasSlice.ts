import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CategoryTypeMasItem {
  categoryTypeID: number;
  categoryType: string;
  [key: string]: any;
}

export interface FetchCategoryTypeMasState {
  loading: boolean;
  error: string | null;
  items: CategoryTypeMasItem[];
}

/** ---- Initial State ---- */
const initialState: FetchCategoryTypeMasState = {
  loading: false,
  error: null,
  items: [],
};

/** ---- Thunk: GET /api/CategoryTypeMas ---- */
export const fetchCategoryTypeMas = createAsyncThunk<
  CategoryTypeMasItem[],
  void,
  { rejectValue: string }
>("categoryTypeMas/fetch", async (_, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/CategoryTypeMas`;
    const res = await axios.get(url);
    const data = Array.isArray(res.data)
      ? (res.data as CategoryTypeMasItem[])
      : [];
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch CategoryTypeMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchCategoryTypeMasSlice = createSlice({
  name: "categoryTypeMas",
  initialState,
  reducers: {
    clearCategoryTypeMas(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoryTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCategoryTypeMas.fulfilled,
        (state, action: PayloadAction<CategoryTypeMasItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchCategoryTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch CategoryTypeMas.";
      });
  },
});

export const { clearCategoryTypeMas } = fetchCategoryTypeMasSlice.actions;
export default fetchCategoryTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCategoryTypeMasItems = (state: any) =>
  (state.categoryTypeMas?.items as CategoryTypeMasItem[]) ?? [];
export const selectCategoryTypeMasLoading = (state: any) =>
  (state.categoryTypeMas?.loading as boolean) ?? false;
export const selectCategoryTypeMasError = (state: any) =>
  (state.categoryTypeMas?.error as string | null) ?? null;
