import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface MarketMas {
  marketID: number;
  finAct: boolean | null;
  marketName: string;
  hotelCode: string;
  showOnFO: boolean | null;
}

interface CreateMarketMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: MarketMas | null;
}

const initialState: CreateMarketMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: POST /api/MarketMas ---- */
export const createMarketMas = createAsyncThunk<
  MarketMas,
  Omit<MarketMas, "marketID">,
  { rejectValue: string }
>("marketMas/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/MarketMas`, payload);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create market master.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createMarketMasSlice = createSlice({
  name: "createMarketMas",
  initialState,
  reducers: {
    resetCreateMarketMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMarketMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createMarketMas.fulfilled,
        (state, action: PayloadAction<MarketMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(createMarketMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create market master.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateMarketMasState } = createMarketMasSlice.actions;
export default createMarketMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateMarketMasLoading = (state: any) =>
  (state.createMarketMas?.loading as boolean) ?? false;
export const selectCreateMarketMasError = (state: any) =>
  (state.createMarketMas?.error as string | null) ?? null;
export const selectCreateMarketMasSuccess = (state: any) =>
  (state.createMarketMas?.success as boolean) ?? false;
export const selectCreateMarketMasData = (state: any) =>
  (state.createMarketMas?.data as MarketMas) ?? null;
