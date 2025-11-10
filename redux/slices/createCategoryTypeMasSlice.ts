import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CreateCategoryTypeMasPayload {
  categoryTypeID?: number;
  categoryType: string;
}

export interface CreateCategoryTypeMasState {
  loading: boolean;
  success: boolean;
  error: string | null;
  responseData: any | null;
}

/** ---- Initial State ---- */
const initialState: CreateCategoryTypeMasState = {
  loading: false,
  success: false,
  error: null,
  responseData: null,
};

/** ---- Thunk: POST /api/CategoryTypeMas ---- */
export const createCategoryTypeMas = createAsyncThunk<
  any,
  CreateCategoryTypeMasPayload,
  { rejectValue: string }
>("categoryTypeMas/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/CategoryTypeMas`;
    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create CategoryTypeMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createCategoryTypeMasSlice = createSlice({
  name: "createCategoryTypeMas",
  initialState,
  reducers: {
    resetCreateCategoryTypeMasState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.responseData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCategoryTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCategoryTypeMas.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = true;
        state.responseData = action.payload;
      })
      .addCase(createCategoryTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create CategoryTypeMas.";
      });
  },
});

export const { resetCreateCategoryTypeMasState } =
  createCategoryTypeMasSlice.actions;

export default createCategoryTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateCategoryTypeMasLoading = (state: any) =>
  (state.createCategoryTypeMas?.loading as boolean) ?? false;
export const selectCreateCategoryTypeMasSuccess = (state: any) =>
  (state.createCategoryTypeMas?.success as boolean) ?? false;
export const selectCreateCategoryTypeMasError = (state: any) =>
  (state.createCategoryTypeMas?.error as string | null) ?? null;
export const selectCreateCategoryTypeMasResponse = (state: any) =>
  state.createCategoryTypeMas?.responseData ?? null;
