import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface MarketMas {
  marketID: number;
  finAct: boolean;
  marketName: string;
  hotelCode: string;
  showOnFO: boolean;
}

/** ---- State ---- */
interface UpdateMarketMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: MarketMas | null;
}

const initialState: UpdateMarketMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/MarketMas/{id} ---- */
export const updateMarketMas = createAsyncThunk<
  MarketMas,
  MarketMas,
  { rejectValue: string }
>("marketMas/update", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/MarketMas/${payload.marketID}`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update MarketMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateMarketMasSlice = createSlice({
  name: "updateMarketMas",
  initialState,
  reducers: {
    resetUpdateMarketMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateMarketMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateMarketMas.fulfilled,
        (state, action: PayloadAction<MarketMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateMarketMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update MarketMas.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateMarketMasState } = updateMarketMasSlice.actions;
export default updateMarketMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateMarketMasLoading = (state: any) =>
  (state.updateMarketMas?.loading as boolean) ?? false;
export const selectUpdateMarketMasError = (state: any) =>
  (state.updateMarketMas?.error as string | null) ?? null;
export const selectUpdateMarketMasSuccess = (state: any) =>
  (state.updateMarketMas?.success as boolean) ?? false;
export const selectUpdateMarketMasData = (state: any) =>
  (state.updateMarketMas?.data as MarketMas | null) ?? null;
