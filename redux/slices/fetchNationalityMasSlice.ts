

// src/redux/slices/fetchNationalityMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface NationalityMasItem {
  nationalityID: number;
  nationality: string;
  countryCode: string;
  country: string;
  [k: string]: any; // allow extra props gracefully
}

/** ---- State ---- */
export interface FetchNationalityMasState {
  loading: boolean;
  error: string | null;
  items: NationalityMasItem[];
  success: boolean;
}

const initialState: FetchNationalityMasState = {
  loading: false,
  error: null,
  items: [],
  success: false,
};

function normalizeArray(res: any): NationalityMasItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as NationalityMasItem[];
  if (typeof res === "object") return [res as NationalityMasItem];
  return [];
}

/** ---- Thunk: GET /api/NationalityMas?nationality= ---- */
export interface FetchNationalityMasParams {
  nationality?: string;
}

export const fetchNationalityMas = createAsyncThunk<
  NationalityMasItem[],
  FetchNationalityMasParams | undefined,
  { rejectValue: string }
>("nationalityMas/fetchAll", async (params: FetchNationalityMasParams = {}, { rejectWithValue }) => {
  try {
    const { nationality } = params;
    const qs = new URLSearchParams();
    if (nationality) qs.append("nationality", nationality);

    const url = `${API_BASE_URL}/api/NationalityMas${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await axios.get(url);
    return normalizeArray(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch NationalityMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchNationalityMasSlice = createSlice({
  name: "nationalityMas",
  initialState,
  reducers: {
    clearNationalityMas(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNationalityMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchNationalityMas.fulfilled,
        (state, action: PayloadAction<NationalityMasItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchNationalityMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch NationalityMas.";
      });
  },
});

export const { clearNationalityMas } = fetchNationalityMasSlice.actions;
export default fetchNationalityMasSlice.reducer;

/** ---- Selectors ---- */
export const selectNationalityMasItems = (s: any) =>
  (s.fetchNationalityMas?.items as NationalityMasItem[]) ?? [];

export const selectNationalityMasLoading = (s: any) =>
  (s.fetchNationalityMas?.loading as boolean) ?? false;

export const selectNationalityMasError = (s: any) =>
  (s.fetchNationalityMas?.error as string | null) ?? null;

export const selectNationalityMasSuccess = (s: any) =>
  (s.fetchNationalityMas?.success as boolean) ?? false;