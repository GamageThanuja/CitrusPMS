import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ItemByPOSCenter {
  id: number;
  posCenterID: number;
  itemID: number;
  price: number;
  guidePrice: number;
  driverPrice: number;
  kidsPrice: number;
  price2: number | null;
}

/** ---- State ---- */
interface FetchItemsByPOSCenterState {
  loading: boolean;
  error: string | null;
  data: ItemByPOSCenter[];
}

const initialState: FetchItemsByPOSCenterState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/ItemsByPOSCenter/get-items-by-poscenter ---- */
export const fetchItemsByPOSCenter = createAsyncThunk<
  ItemByPOSCenter[],
  void,
  { rejectValue: string }
>("itemsByPOSCenter/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/ItemsByPOSCenter/get-items-by-poscenter`
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch items by POS center.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchItemsByPOSCenterSlice = createSlice({
  name: "fetchItemsByPOSCenter",
  initialState,
  reducers: {
    resetItemsByPOSCenterState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemsByPOSCenter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchItemsByPOSCenter.fulfilled,
        (state, action: PayloadAction<ItemByPOSCenter[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchItemsByPOSCenter.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch items by POS center.";
      });
  },
});

/** ---- Exports ---- */
export const { resetItemsByPOSCenterState } = fetchItemsByPOSCenterSlice.actions;
export default fetchItemsByPOSCenterSlice.reducer;

/** ---- Selectors ---- */
export const selectItemsByPOSCenterLoading = (state: any) =>
  (state.fetchItemsByPOSCenter?.loading as boolean) ?? false;
export const selectItemsByPOSCenterError = (state: any) =>
  (state.fetchItemsByPOSCenter?.error as string | null) ?? null;
export const selectItemsByPOSCenterData = (state: any) =>
  (state.fetchItemsByPOSCenter?.data as ItemByPOSCenter[]) ?? [];
