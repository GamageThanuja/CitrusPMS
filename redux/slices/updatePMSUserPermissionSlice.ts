import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface PMSUserPermission {
  id: number;
  userID: number;
  moduleID: number;
  category: string;
  isPermitted: boolean;
}

/** ---- State ---- */
interface UpdatePMSUserPermissionState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: PMSUserPermission | null;
}

const initialState: UpdatePMSUserPermissionState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/PMSUserPermission/Update/{id} ---- */
export const updatePMSUserPermission = createAsyncThunk<
  PMSUserPermission,
  PMSUserPermission,
  { rejectValue: string }
>("pmsUserPermission/update", async (payload, { rejectWithValue }) => {
  try {
    const { id, userID, moduleID, category, isPermitted } = payload;

    const response = await axios.put(
      `${API_BASE_URL}/api/PMSUserPermission/Update/${id}`,
      {
        id,
        userID,
        moduleID,
        category,
        isPermitted,
      }
    );

    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update PMS User Permission.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updatePMSUserPermissionSlice = createSlice({
  name: "updatePMSUserPermission",
  initialState,
  reducers: {
    resetUpdatePMSUserPermissionState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updatePMSUserPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updatePMSUserPermission.fulfilled,
        (state, action: PayloadAction<PMSUserPermission>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updatePMSUserPermission.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update PMS User Permission.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdatePMSUserPermissionState } =
  updatePMSUserPermissionSlice.actions;
export default updatePMSUserPermissionSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdatePMSUserPermissionLoading = (state: any) =>
  (state.updatePMSUserPermission?.loading as boolean) ?? false;
export const selectUpdatePMSUserPermissionError = (state: any) =>
  (state.updatePMSUserPermission?.error as string | null) ?? null;
export const selectUpdatePMSUserPermissionSuccess = (state: any) =>
  (state.updatePMSUserPermission?.success as boolean) ?? false;
export const selectUpdatePMSUserPermissionData = (state: any) =>
  (state.updatePMSUserPermission?.data as PMSUserPermission) ?? null;
