// redux/slices/updateSalesExecutiveMasSlice.ts
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

interface UpdateSalesExecutiveState {
  loading: boolean;
  error: string | null;
  data: SalesExecutive[];
}

const initialState: UpdateSalesExecutiveState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: PUT /api/SalesExecutiveMas/{executiveCode} ---- */
export const updateSalesExecutiveMas = createAsyncThunk<
  SalesExecutive,
  { executiveCode: string; payload: Partial<SalesExecutive> },
  { rejectValue: string }
>(
  "salesExecutive/update",
  async ({ executiveCode, payload }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/SalesExecutiveMas/${executiveCode}`,
        payload
      );
      return response.data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to update sales executive.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const updateSalesExecutiveMasSlice = createSlice({
  name: "updateSalesExecutiveMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateSalesExecutiveMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSalesExecutiveMas.fulfilled, (state, action: PayloadAction<SalesExecutive>) => {
        state.loading = false;
        // Always update store: find index and replace
        const index = state.data.findIndex(
          (item) => item.executiveCode === action.payload.executiveCode
        );
        if (index >= 0) {
          state.data[index] = action.payload;
        } else {
          // If not in store, add it
          state.data.push(action.payload);
        }
      })
      .addCase(updateSalesExecutiveMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update sales executive.";
      });
  },
});

/** ---- Exports ---- */
export default updateSalesExecutiveMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateSalesExecutiveLoading = (state: any) =>
  state.updateSalesExecutiveMas?.loading ?? false;
export const selectUpdateSalesExecutiveError = (state: any) =>
  state.updateSalesExecutiveMas?.error ?? null;
export const selectUpdatedSalesExecutiveData = (state: any) =>
  state.updateSalesExecutiveMas?.data ?? [];
