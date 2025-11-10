import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ItemsByPOSCenter {
  id: number;
  posCenterID: number;
  itemID: number;
  price: number;
  guidePrice: number;
  driverPrice: number;
  kidsPrice: number;
  price2: number;
}

/** ---- State ---- */
interface UpdateItemsByPOSCenterState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: ItemsByPOSCenter | null;
}

const initialState: UpdateItemsByPOSCenterState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/ItemsByPOSCenter/{id} ---- */
export const updateItemsByPOSCenter = createAsyncThunk<
  ItemsByPOSCenter,
  ItemsByPOSCenter,
  { rejectValue: string }
>("itemsByPOSCenter/update", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/ItemsByPOSCenter/${payload.id}`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update ItemsByPOSCenter.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateItemsByPOSCenterSlice = createSlice({
  name: "updateItemsByPOSCenter",
  initialState,
  reducers: {
    resetUpdateItemsByPOSCenterState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateItemsByPOSCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateItemsByPOSCenter.fulfilled,
        (state, action: PayloadAction<ItemsByPOSCenter>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateItemsByPOSCenter.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update ItemsByPOSCenter.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateItemsByPOSCenterState } =
  updateItemsByPOSCenterSlice.actions;
export default updateItemsByPOSCenterSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateItemsByPOSCenterLoading = (state: any) =>
  (state.updateItemsByPOSCenter?.loading as boolean) ?? false;
export const selectUpdateItemsByPOSCenterError = (state: any) =>
  (state.updateItemsByPOSCenter?.error as string | null) ?? null;
export const selectUpdateItemsByPOSCenterSuccess = (state: any) =>
  (state.updateItemsByPOSCenter?.success as boolean) ?? false;
export const selectUpdateItemsByPOSCenterData = (state: any) =>
  (state.updateItemsByPOSCenter?.data as ItemsByPOSCenter | null) ?? null;
