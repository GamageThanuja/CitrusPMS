import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface UpdateNationalityMasPayload {
  nationality: string; // path param
  nationalityID?: number;
  countryCode: string;
  country: string;
}

export interface UpdateNationalityMasResponse {
  nationalityID: number;
  nationality: string;
  countryCode: string;
  country: string;
}

export interface UpdateNationalityMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  item: UpdateNationalityMasResponse | null;
}

const initialState: UpdateNationalityMasState = {
  loading: false,
  error: null,
  success: false,
  item: null,
};

/** ---- Thunk: PUT /api/NationalityMas/{nationality} ---- */
export const updateNationalityMas = createAsyncThunk<
  UpdateNationalityMasResponse,
  UpdateNationalityMasPayload,
  { rejectValue: string }
>(
  "nationalityMas/update",
  async ({ nationality, ...payload }, { rejectWithValue }) => {
    try {
      const url = `${API_BASE_URL}/api/NationalityMas/${encodeURIComponent(nationality)}`;
      const res = await axios.put(url, payload);
      return res.data as UpdateNationalityMasResponse;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to update nationality.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const updateNationalityMasSlice = createSlice({
  name: "updateNationalityMas",
  initialState,
  reducers: {
    clearUpdateNationalityMas(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.item = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateNationalityMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateNationalityMas.fulfilled,
        (state, action: PayloadAction<UpdateNationalityMasResponse>) => {
          state.loading = false;
          state.success = true;
          state.item = action.payload;
        }
      )
      .addCase(updateNationalityMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to update nationality.";
      });
  },
});

export const { clearUpdateNationalityMas } = updateNationalityMasSlice.actions;
export default updateNationalityMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateNationalityMasLoading = (s: any) =>
  (s.updateNationalityMas?.loading as boolean) ?? false;

export const selectUpdateNationalityMasError = (s: any) =>
  (s.updateNationalityMas?.error as string | null) ?? null;

export const selectUpdateNationalityMasSuccess = (s: any) =>
  (s.updateNationalityMas?.success as boolean) ?? false;

export const selectUpdateNationalityMasItem = (s: any) =>
  s.updateNationalityMas?.item ?? null;
