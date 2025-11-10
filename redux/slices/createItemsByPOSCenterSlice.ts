import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CreateItemByPOSCenterRequest {
  id: number;
  posCenterID: number;
  itemID: number;
  price: number;
  guidePrice: number;
  driverPrice: number;
  kidsPrice: number;
  price2: number;
}

export interface CreateItemByPOSCenterResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

/** ---- State ---- */
interface CreateItemsByPOSCenterState {
  loading: boolean;
  error: string | null;
  success: boolean;
  response: CreateItemByPOSCenterResponse | null;
}

const initialState: CreateItemsByPOSCenterState = {
  loading: false,
  error: null,
  success: false,
  response: null,
};

/** ---- Thunk: POST /api/ItemsByPOSCenter/add-item ---- */
export const createItemByPOSCenter = createAsyncThunk<
  CreateItemByPOSCenterResponse,
  CreateItemByPOSCenterRequest,
  { rejectValue: string }
>("itemsByPOSCenter/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/ItemsByPOSCenter/add-item`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create item by POS center.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createItemsByPOSCenterSlice = createSlice({
  name: "createItemsByPOSCenter",
  initialState,
  reducers: {
    resetCreateItemsByPOSCenterState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createItemByPOSCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createItemByPOSCenter.fulfilled,
        (state, action: PayloadAction<CreateItemByPOSCenterResponse>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(createItemByPOSCenter.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to create item by POS center.";
        state.success = false;
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateItemsByPOSCenterState } =
  createItemsByPOSCenterSlice.actions;
export default createItemsByPOSCenterSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateItemsByPOSCenterLoading = (state: any) =>
  (state.createItemsByPOSCenter?.loading as boolean) ?? false;
export const selectCreateItemsByPOSCenterError = (state: any) =>
  (state.createItemsByPOSCenter?.error as string | null) ?? null;
export const selectCreateItemsByPOSCenterSuccess = (state: any) =>
  (state.createItemsByPOSCenter?.success as boolean) ?? false;
export const selectCreateItemsByPOSCenterResponse = (state: any) =>
  (state.createItemsByPOSCenter?.response as
    | CreateItemByPOSCenterResponse
    | null) ?? null;
