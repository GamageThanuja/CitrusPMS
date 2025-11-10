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

interface FetchPMSUserPermissionState {
  loading: boolean;
  data: PMSUserPermission[];
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: FetchPMSUserPermissionState = {
  loading: false,
  data: [],
  error: null,
};

/** ---- Thunk: GET /api/PMSUserPermission/GetByUserId?userId= ---- */
export const fetchPMSUserPermission = createAsyncThunk<
  PMSUserPermission[],
  number, // userID
  { rejectValue: string }
>("pmsUserPermission/fetchByUserId", async (userID, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/PMSUserPermission/GetByUserId?userId=${userID}`;
    const response = await axios.get(url);
    return response.data as PMSUserPermission[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch PMS user permissions.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchPMSUserPermissionSlice = createSlice({
  name: "fetchPMSUserPermission",
  initialState,
  reducers: {
    resetPMSUserPermission(state) {
      state.loading = false;
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPMSUserPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPMSUserPermission.fulfilled,
        (state, action: PayloadAction<PMSUserPermission[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchPMSUserPermission.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? "Failed to fetch PMS user permissions.";
      });
  },
});

/** ---- Exports ---- */
export const { resetPMSUserPermission } = fetchPMSUserPermissionSlice.actions;
export default fetchPMSUserPermissionSlice.reducer;

/** ---- Selectors ---- */
export const selectPMSUserPermissionData = (state: any) =>
  (state.fetchPMSUserPermission?.data as PMSUserPermission[]) ?? [];
export const selectPMSUserPermissionLoading = (state: any) =>
  (state.fetchPMSUserPermission?.loading as boolean) ?? false;
export const selectPMSUserPermissionError = (state: any) =>
  (state.fetchPMSUserPermission?.error as string | null) ?? null;
