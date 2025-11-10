// redux/slices/createSalesExecutiveMasSlice.ts
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

interface CreateSalesExecutiveState {
  loading: boolean;
  error: string | null;
  data: SalesExecutive[];
}

const initialState: CreateSalesExecutiveState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: POST /api/SalesExecutiveMas ---- */
export const createSalesExecutiveMas = createAsyncThunk<
  SalesExecutive,
  Partial<SalesExecutive>,
  { rejectValue: string }
>("salesExecutive/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/SalesExecutiveMas`, payload);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create sales executive.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createSalesExecutiveMasSlice = createSlice({
  name: "createSalesExecutiveMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createSalesExecutiveMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSalesExecutiveMas.fulfilled, (state, action: PayloadAction<SalesExecutive>) => {
        state.loading = false;
        // Always add to store
        state.data.push(action.payload);
      })
      .addCase(createSalesExecutiveMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create sales executive.";
      });
  },
});

/** ---- Exports ---- */
export default createSalesExecutiveMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateSalesExecutiveLoading = (state: any) =>
  state.createSalesExecutiveMas?.loading ?? false;
export const selectCreateSalesExecutiveError = (state: any) =>
  state.createSalesExecutiveMas?.error ?? null;
export const selectCreatedSalesExecutiveData = (state: any) =>
  state.createSalesExecutiveMas?.data ?? [];
