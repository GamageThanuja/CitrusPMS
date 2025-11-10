import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface CreateNationalityMasPayload {
  nationalityID?: number;
  nationality: string;
  countryCode: string;
  country: string;
}

export interface CreateNationalityMasResponse {
  nationalityID: number;
  nationality: string;
  countryCode: string;
  country: string;
}

export interface CreateNationalityMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  item: CreateNationalityMasResponse | null;
}

const initialState: CreateNationalityMasState = {
  loading: false,
  error: null,
  success: false,
  item: null,
};

/** ---- Thunk: POST /api/NationalityMas ---- */
export const createNationalityMas = createAsyncThunk<
  CreateNationalityMasResponse,
  CreateNationalityMasPayload,
  { rejectValue: string }
>("nationalityMas/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/NationalityMas`;
    const res = await axios.post(url, payload);
    return res.data as CreateNationalityMasResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create nationality.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createNationalityMasSlice = createSlice({
  name: "createNationalityMas",
  initialState,
  reducers: {
    clearCreateNationalityMas(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.item = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNationalityMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createNationalityMas.fulfilled,
        (state, action: PayloadAction<CreateNationalityMasResponse>) => {
          state.loading = false;
          state.success = true;
          state.item = action.payload;
        }
      )
      .addCase(createNationalityMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to create nationality.";
      });
  },
});

export const { clearCreateNationalityMas } = createNationalityMasSlice.actions;
export default createNationalityMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateNationalityMasLoading = (s: any) =>
  (s.createNationalityMas?.loading as boolean) ?? false;

export const selectCreateNationalityMasError = (s: any) =>
  (s.createNationalityMas?.error as string | null) ?? null;

export const selectCreateNationalityMasSuccess = (s: any) =>
  (s.createNationalityMas?.success as boolean) ?? false;

export const selectCreateNationalityMasItem = (s: any) =>
  s.createNationalityMas?.item ?? null;
