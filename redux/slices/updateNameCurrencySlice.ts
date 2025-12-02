// src/redux/slices/updateNameCurrencySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Request Body Type ---- */
export interface UpdateNameCurrencyPayload {
  property_id: string | null;
  hotel_id: number;
  ota_name: string;
  currency: string;
}

/** ---- Response Type (API returns “string”) ---- */
export type UpdateNameCurrencyResponse = string;

/** ---- Slice State ---- */
interface UpdateNameCurrencyState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: UpdateNameCurrencyResponse | null;
}

const initialState: UpdateNameCurrencyState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

/** ---- Thunk: PUT /api/{reservationId}/update-name-currency ---- */
export const updateNameCurrency = createAsyncThunk<
  UpdateNameCurrencyResponse,
  { reservationId: number; payload: UpdateNameCurrencyPayload },
  { rejectValue: string }
>("updateNameCurrency/put", async ({ reservationId, payload }, { rejectWithValue }) => {
  try {
    const res = await axios.put(
      `${API_BASE_URL}/api/${reservationId}/update-name-currency`,
      payload
    );
    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update name & currency.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateNameCurrencySlice = createSlice({
  name: "updateNameCurrency",
  initialState,
  reducers: {
    resetUpdateNameCurrencyState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateNameCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.data = null;
      })
      .addCase(
        updateNameCurrency.fulfilled,
        (state, action: PayloadAction<UpdateNameCurrencyResponse>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateNameCurrency.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update name & currency.";
      });
  },
});

export const { resetUpdateNameCurrencyState } = updateNameCurrencySlice.actions;
export default updateNameCurrencySlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateNameCurrencyLoading = (state: any) =>
  (state.updateNameCurrency?.loading as boolean) ?? false;

export const selectUpdateNameCurrencySuccess = (state: any) =>
  (state.updateNameCurrency?.success as boolean) ?? false;

export const selectUpdateNameCurrencyError = (state: any) =>
  (state.updateNameCurrency?.error as string | null) ?? null;

export const selectUpdateNameCurrencyData = (state: any) =>
  (state.updateNameCurrency?.data as UpdateNameCurrencyResponse | null) ?? null;