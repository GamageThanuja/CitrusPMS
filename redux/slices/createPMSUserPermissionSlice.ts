import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CreatePMSUserPermissionPayload {
  id: number;
  userID: number;
  moduleID: number;
  category: string;
  isPermitted: boolean;
}

interface CreatePMSUserPermissionState {
  loading: boolean;
  success: boolean;
  data: CreatePMSUserPermissionPayload | null;
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: CreatePMSUserPermissionState = {
  loading: false,
  success: false,
  data: null,
  error: null,
};

/** ---- Thunk: POST /api/PMSUserPermission/Create ---- */
export const createPMSUserPermission = createAsyncThunk<
  CreatePMSUserPermissionPayload,
  CreatePMSUserPermissionPayload,
  { rejectValue: string }
>("pmsUserPermission/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/PMSUserPermission/Create`;
    const response = await axios.post(url, payload);
    return response.data as CreatePMSUserPermissionPayload;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create PMS user permission.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createPMSUserPermissionSlice = createSlice({
  name: "createPMSUserPermission",
  initialState,
  reducers: {
    resetCreatePMSUserPermission(state) {
      state.loading = false;
      state.success = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPMSUserPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createPMSUserPermission.fulfilled,
        (state, action: PayloadAction<CreatePMSUserPermissionPayload>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(createPMSUserPermission.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) ?? "Failed to create PMS user permission.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreatePMSUserPermission } =
  createPMSUserPermissionSlice.actions;
export default createPMSUserPermissionSlice.reducer;

/** ---- Selectors ---- */
export const selectCreatePMSUserPermissionData = (state: any) =>
  (state.createPMSUserPermission?.data as CreatePMSUserPermissionPayload | null) ??
  null;
export const selectCreatePMSUserPermissionLoading = (state: any) =>
  (state.createPMSUserPermission?.loading as boolean) ?? false;
export const selectCreatePMSUserPermissionError = (state: any) =>
  (state.createPMSUserPermission?.error as string | null) ?? null;
export const selectCreatePMSUserPermissionSuccess = (state: any) =>
  (state.createPMSUserPermission?.success as boolean) ?? false;
