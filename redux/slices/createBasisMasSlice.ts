

// src/redux/slices/createBasisMasSlice.ts
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

// Request body for POST /api/BasisMas
export interface CreateBasisMasPayload {
  basisID: number; // if server ignores on create, you can pass 0
  basis: string;
  cmRateID: string;
  showOnIBE: boolean;
  descOnIBE: string;
}

/** ---- State ---- */
export interface CreateBasisMasState {
  loading: boolean;
  error: string | null;
  item: BasisMasItem | null; // created record returned by API
  success: boolean;
  lastCreatedAt: string | null; // ISO timestamp of last success
}

const initialState: CreateBasisMasState = {
  loading: false,
  error: null,
  item: null,
  success: false,
  lastCreatedAt: null,
};

function normalizeObject(res: any): BasisMasItem | null {
  if (!res) return null;
  if (Array.isArray(res)) return (res[0] as BasisMasItem) ?? null;
  if (typeof res === "object") return res as BasisMasItem;
  return null;
}

/** ---- Thunk: POST /api/BasisMas ---- */
export const createBasisMas = createAsyncThunk<
  BasisMasItem | null,
  CreateBasisMasPayload,
  { rejectValue: string }
>("basisMas/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/BasisMas`;
    const res = await axios.post(url, payload);
    return normalizeObject(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create BasisMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createBasisMasSlice = createSlice({
  name: "createBasisMas",
  initialState,
  reducers: {
    clearCreateBasisMas(state) {
      state.loading = false;
      state.error = null;
      state.item = null;
      state.success = false;
      state.lastCreatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBasisMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createBasisMas.fulfilled,
        (state, action: PayloadAction<BasisMasItem | null>) => {
          state.loading = false;
          state.item = action.payload ?? null;
          state.success = true;
          state.lastCreatedAt = new Date().toISOString();
        }
      )
      .addCase(createBasisMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to create BasisMas.";
      });
  },
});

export const { clearCreateBasisMas } = createBasisMasSlice.actions;
export default createBasisMasSlice.reducer;

/** ---- Selectors (optional) ---- */
export const selectCreateBasisMasItem = (s: any) =>
  (s.createBasisMas?.item as BasisMasItem | null) ?? null;
export const selectCreateBasisMasLoading = (s: any) =>
  (s.createBasisMas?.loading as boolean) ?? false;
export const selectCreateBasisMasError = (s: any) =>
  (s.createBasisMas?.error as string | null) ?? null;
export const selectCreateBasisMasSuccess = (s: any) =>
  (s.createBasisMas?.success as boolean) ?? false;
export const selectCreateBasisMasLastCreatedAt = (s: any) =>
  (s.createBasisMas?.lastCreatedAt as string | null) ?? null;