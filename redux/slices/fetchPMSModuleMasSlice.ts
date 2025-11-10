import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types from API ---- */
export interface PMSModuleMasItem {
  pmsModuleID: number;
  category: string;
  moduleName: string;
  url: string;
  isActive: boolean;
  seq: number | null;
  visible: boolean;
  isTested: boolean;
  [k: string]: any;
}

/** ---- State ---- */
interface FetchPMSModuleMasState {
  loading: boolean;
  error: string | null;
  items: PMSModuleMasItem[];
}

const initialState: FetchPMSModuleMasState = {
  loading: false,
  error: null,
  items: [],
};

/** ---- Thunk: GET /api/PMSModuleMas ---- */
export const fetchPMSModuleMas = createAsyncThunk<
  PMSModuleMasItem[],
  void,
  { rejectValue: string }
>("pmsModuleMas/fetch", async (_, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/PMSModuleMas`;
    const res = await axios.get(url);
    const data = Array.isArray(res.data)
      ? (res.data as PMSModuleMasItem[])
      : [];
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch PMSModuleMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchPMSModuleMasSlice = createSlice({
  name: "pmsModuleMas",
  initialState,
  reducers: {
    clearPMSModuleMas(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPMSModuleMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPMSModuleMas.fulfilled,
        (state, action: PayloadAction<PMSModuleMasItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchPMSModuleMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? "Failed to fetch PMSModuleMas.";
      });
  },
});

export const { clearPMSModuleMas } = fetchPMSModuleMasSlice.actions;
export default fetchPMSModuleMasSlice.reducer;

/** ---- Selectors ---- */
export const selectPMSModuleMasItems = (state: any) =>
  (state.fetchPMSModuleMas?.items as PMSModuleMasItem[]) ?? [];
export const selectPMSModuleMasLoading = (state: any) =>
  (state.fetchPMSModuleMas?.loading as boolean) ?? false;
export const selectPMSModuleMasError = (state: any) =>
  (state.fetchPMSModuleMas?.error as string | null) ?? null;
