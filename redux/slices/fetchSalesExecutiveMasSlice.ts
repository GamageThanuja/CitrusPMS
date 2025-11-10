// redux/slices/fetchSalesExecutiveMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SalesExecutive {
  exceutiveID: number;
  executiveCode: string;
  name: string;
  joinedDate: string;
  resignedDate: string;
  address: string;
  createdBy: string;
  lastModBy: string;
  lastModOn: string;
  phone: string;
  email: string;
  finAct: boolean;
  createdOn: string;
}

interface FetchSalesExecutiveState {
  loading: boolean;
  error: string | null;
  data: SalesExecutive[];
}

const initialState: FetchSalesExecutiveState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/SalesExecutiveMas ---- */
export const fetchSalesExecutiveMas = createAsyncThunk<
  SalesExecutive[],
  { executiveCode?: string } | undefined,
  { rejectValue: string }
>("salesExecutive/fetch", async (params, { rejectWithValue }) => {
  try {
    const query = params?.executiveCode
      ? `?executiveCode=${encodeURIComponent(params.executiveCode)}`
      : "";
    const response = await axios.get(`${API_BASE_URL}/api/SalesExecutiveMas${query}`);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch sales executives.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchSalesExecutiveMasSlice = createSlice({
  name: "fetchSalesExecutiveMas",
  initialState,
  reducers: {
    resetSalesExecutiveData(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesExecutiveMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSalesExecutiveMas.fulfilled,
        (state, action: PayloadAction<SalesExecutive[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchSalesExecutiveMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch sales executives.";
      });
  },
});

/** ---- Exports ---- */
export const { resetSalesExecutiveData } = fetchSalesExecutiveMasSlice.actions;
export default fetchSalesExecutiveMasSlice.reducer;

/** ---- Selectors ---- */
export const selectSalesExecutiveLoading = (state: any) =>
  state.fetchSalesExecutiveMas?.loading ?? false;
export const selectSalesExecutiveError = (state: any) =>
  state.fetchSalesExecutiveMas?.error ?? null;
export const selectSalesExecutiveData = (state: any) =>
  state.fetchSalesExecutiveMas?.data ?? [];
