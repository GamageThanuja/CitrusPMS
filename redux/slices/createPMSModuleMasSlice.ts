import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CreatePMSModuleMasPayload {
  pmsModuleID?: number;
  category: string;
  moduleName: string;
  url: string;
  isActive: boolean;
  seq: number | null;
  visible: boolean;
  isTested: boolean;
}

interface CreatePMSModuleMasState {
  loading: boolean;
  success: boolean;
  error: string | null;
  createdItem: CreatePMSModuleMasPayload | null;
}

/** ---- Initial State ---- */
const initialState: CreatePMSModuleMasState = {
  loading: false,
  success: false,
  error: null,
  createdItem: null,
};

/** ---- Thunk: POST /api/PMSModuleMas ---- */
export const createPMSModuleMas = createAsyncThunk<
  CreatePMSModuleMasPayload,
  CreatePMSModuleMasPayload,
  { rejectValue: string }
>("pmsModuleMas/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/PMSModuleMas`;
    const response = await axios.post(url, payload);
    return response.data as CreatePMSModuleMasPayload;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create PMSModuleMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createPMSModuleMasSlice = createSlice({
  name: "createPMSModuleMas",
  initialState,
  reducers: {
    resetCreatePMSModuleMas(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.createdItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPMSModuleMas.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        createPMSModuleMas.fulfilled,
        (state, action: PayloadAction<CreatePMSModuleMasPayload>) => {
          state.loading = false;
          state.success = true;
          state.createdItem = action.payload;
        }
      )
      .addCase(createPMSModuleMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ?? "Failed to create PMSModuleMas.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreatePMSModuleMas } = createPMSModuleMasSlice.actions;
export default createPMSModuleMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreatePMSModuleMasLoading = (state: any) =>
  (state.createPMSModuleMas?.loading as boolean) ?? false;
export const selectCreatePMSModuleMasSuccess = (state: any) =>
  (state.createPMSModuleMas?.success as boolean) ?? false;
export const selectCreatePMSModuleMasError = (state: any) =>
  (state.createPMSModuleMas?.error as string | null) ?? null;
export const selectCreatedPMSModuleMasItem = (state: any) =>
  (state.createPMSModuleMas?.createdItem as CreatePMSModuleMasPayload | null) ??
  null;
