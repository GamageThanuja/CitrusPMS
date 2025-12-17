// src/redux/slices/deleteItemMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Args for thunk ---- */
export interface DeleteItemMasArgs {
  itemNumber: string; // path param
}

/** ---- State ---- */
interface DeleteItemMasState {
  loading: boolean;
  success: boolean;
  error: string | null;
  response: any;
}

const initialState: DeleteItemMasState = {
  loading: false,
  success: false,
  error: null,
  response: null,
};

/** ---- Async Thunk: DELETE /api/ItemMas/{itemNumber} ---- */
export const deleteItemMas = createAsyncThunk<
  any,
  DeleteItemMasArgs,
  { rejectValue: string }
>("itemMas/delete", async ({ itemNumber }, { rejectWithValue }) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/ItemMas/${encodeURIComponent(itemNumber)}`
    );
    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to delete ItemMas.";
    return rejectWithValue(message);
  }
});

/** ---- Slice ---- */
const deleteItemMasSlice = createSlice({
  name: "deleteItemMas",
  initialState,
  reducers: {
    resetDeleteItemMasState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteItemMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        deleteItemMas.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(deleteItemMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to delete ItemMas.";
      });
  },
});

/** ---- Exports ---- */
export const { resetDeleteItemMasState } = deleteItemMasSlice.actions;
export default deleteItemMasSlice.reducer;

/** ---- Selectors ---- */
export const selectDeleteItemMasLoading = (state: any) =>
  state.deleteItemMas?.loading as boolean | undefined;

export const selectDeleteItemMasError = (state: any) =>
  state.deleteItemMas?.error as string | null | undefined;

export const selectDeleteItemMasSuccess = (state: any) =>
  state.deleteItemMas?.success as boolean | undefined;

export const selectDeleteItemMasResponse = (state: any) =>
  state.deleteItemMas?.response;