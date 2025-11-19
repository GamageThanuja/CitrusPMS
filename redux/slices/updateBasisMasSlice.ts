// src/redux/slices/updateBasisMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (mirrors API body) ---- */
export interface BasisMas {
  basisID: number;
  basis: string;        // used as basisKey in the path
  cmRateID: string;
  showOnIBE: boolean;
  descOnIBE: string;
  // allow extra props gracefully
  [k: string]: any;
}

/** ---- State ---- */
interface UpdateBasisMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: BasisMas | null;
}

const initialState: UpdateBasisMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/BasisMas/{basisKey} ----
 * basisKey is assumed to be the `basis` field from the payload.
 */
export const updateBasisMas = createAsyncThunk<
  BasisMas,
  BasisMas,
  { rejectValue: string }
>("basisMas/update", async (payload, { rejectWithValue }) => {
  try {
    const { basis } = payload; // basisKey
    const res = await axios.put(
      `${API_BASE_URL}/api/BasisMas/${encodeURIComponent(basis)}`,
      payload
    );
    return res.data as BasisMas;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update basis.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateBasisMasSlice = createSlice({
  name: "updateBasisMas",
  initialState,
  reducers: {
    resetUpdateBasisMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateBasisMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateBasisMas.fulfilled,
        (state, action: PayloadAction<BasisMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateBasisMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update basis.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateBasisMasState } = updateBasisMasSlice.actions;
export default updateBasisMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateBasisMasLoading = (state: any) =>
  (state.updateBasisMas?.loading as boolean) ?? false;

export const selectUpdateBasisMasError = (state: any) =>
  (state.updateBasisMas?.error as string | null) ?? null;

export const selectUpdateBasisMasSuccess = (state: any) =>
  (state.updateBasisMas?.success as boolean) ?? false;

export const selectUpdateBasisMasData = (state: any) =>
  (state.updateBasisMas?.data as BasisMas | null) ?? null;