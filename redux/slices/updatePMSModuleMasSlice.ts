import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface PMSModuleMas {
  pmsModuleID: number;
  category: string;
  moduleName: string;
  url: string;
  isActive: boolean;
  seq: number;
  visible: boolean;
  isTested: boolean;
}

/** ---- State ---- */
interface UpdatePMSModuleMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: PMSModuleMas | null;
}

const initialState: UpdatePMSModuleMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/PMSModuleMas/{id} ---- */
export const updatePMSModuleMas = createAsyncThunk<
  PMSModuleMas,
  PMSModuleMas,
  { rejectValue: string }
>("pmsModuleMas/update", async (payload, { rejectWithValue }) => {
  try {
    const {
      pmsModuleID,
      category,
      moduleName,
      url,
      isActive,
      seq,
      visible,
      isTested,
    } = payload;

    const response = await axios.put(
      `${API_BASE_URL}/api/PMSModuleMas/${pmsModuleID}`,
      {
        pmsModuleID,
        category,
        moduleName,
        url,
        isActive,
        seq,
        visible,
        isTested,
      }
    );

    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update PMS Module Master.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updatePMSModuleMasSlice = createSlice({
  name: "updatePMSModuleMas",
  initialState,
  reducers: {
    resetUpdatePMSModuleMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updatePMSModuleMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updatePMSModuleMas.fulfilled,
        (state, action: PayloadAction<PMSModuleMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updatePMSModuleMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update PMS Module Master.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdatePMSModuleMasState } =
  updatePMSModuleMasSlice.actions;
export default updatePMSModuleMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdatePMSModuleMasLoading = (state: any) =>
  (state.updatePMSModuleMas?.loading as boolean) ?? false;
export const selectUpdatePMSModuleMasError = (state: any) =>
  (state.updatePMSModuleMas?.error as string | null) ?? null;
export const selectUpdatePMSModuleMasSuccess = (state: any) =>
  (state.updatePMSModuleMas?.success as boolean) ?? false;
export const selectUpdatePMSModuleMasData = (state: any) =>
  (state.updatePMSModuleMas?.data as PMSModuleMas) ?? null;
