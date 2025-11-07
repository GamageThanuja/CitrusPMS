// src/redux/slices/editBasisMasByBasisKeySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface BasisMasItem {
  basisID: number;
  basis: string;
  cmRateID: string;
  showOnIBE: boolean;
  descOnIBE: string;
  [k: string]: any;
}

export interface EditBasisMasPayload {
  basisID: number;
  basis: string;
  cmRateID: string;
  showOnIBE: boolean;
  descOnIBE: string;
}

export interface EditBasisMasArgs {
  basisKey: string | number;       // path param
  data: EditBasisMasPayload;       // request body
}

/** ---- State ---- */
export interface EditBasisMasState {
  loading: boolean;
  error: string | null;
  item: BasisMasItem | null;       // updated record
  success: boolean;
  lastUpdatedAt: string | null;    // ISO timestamp of last success
}

const initialState: EditBasisMasState = {
  loading: false,
  error: null,
  item: null,
  success: false,
  lastUpdatedAt: null,
};

function normalizeObject(res: any): BasisMasItem | null {
  if (!res) return null;
  if (Array.isArray(res)) return (res[0] as BasisMasItem) ?? null;
  if (typeof res === "object") return res as BasisMasItem;
  return null;
}

/** ---- Thunk: PUT /api/BasisMas/{basisKey} ---- */
export const editBasisMasByBasisKey = createAsyncThunk<
  BasisMasItem | null,
  EditBasisMasArgs,
  { rejectValue: string }
>("basisMas/editByBasisKey", async ({ basisKey, data }, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/BasisMas/${encodeURIComponent(String(basisKey))}`;
    const res = await axios.put(url, data);
    return normalizeObject(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update BasisMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const editBasisMasByBasisKeySlice = createSlice({
  name: "editBasisMasByBasisKey",
  initialState,
  reducers: {
    clearEditBasisMas(state) {
      state.loading = false;
      state.error = null;
      state.item = null;
      state.success = false;
      state.lastUpdatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(editBasisMasByBasisKey.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        editBasisMasByBasisKey.fulfilled,
        (state, action: PayloadAction<BasisMasItem | null>) => {
          state.loading = false;
          state.item = action.payload ?? null;
          state.success = true;
          state.lastUpdatedAt = new Date().toISOString();
        }
      )
      .addCase(editBasisMasByBasisKey.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update BasisMas.";
      });
  },
});

export const { clearEditBasisMas } = editBasisMasByBasisKeySlice.actions;
export default editBasisMasByBasisKeySlice.reducer;

/** ---- Selectors (optional) ---- */
export const selectEditBasisItem = (s: any) =>
  (s.editBasisMasByBasisKey?.item as BasisMasItem | null) ?? null;
export const selectEditBasisLoading = (s: any) =>
  (s.editBasisMasByBasisKey?.loading as boolean) ?? false;
export const selectEditBasisError = (s: any) =>
  (s.editBasisMasByBasisKey?.error as string | null) ?? null;
export const selectEditBasisSuccess = (s: any) =>
  (s.editBasisMasByBasisKey?.success as boolean) ?? false;
export const selectEditBasisLastUpdatedAt = (s: any) =>
  (s.editBasisMasByBasisKey?.lastUpdatedAt as string | null) ?? null;