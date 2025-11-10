// redux/slices/updateTaxTableSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface TaxTable {
  recordID: number;
  vat: number;
  nbt: number;
  sc: number;
  cityTax: number;
  hotelCode: string;
  poS_SC: number;
  poS_VAT: number;
  poS_NBT: number;
  poS_CityTax: number;
  isNBTInclude: boolean;
  greenTax: number;
  dateFrom: string;
  dateTo: string;
  calcMethod: number;
  createdOn: string;
  createdBy: string;
}

interface UpdateTaxTableState {
  loading: boolean;
  error: string | null;
  data: TaxTable[];
}

const initialState: UpdateTaxTableState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: PUT /api/TaxTable/{hotelCode} ---- */
export const updateTaxTable = createAsyncThunk<
  TaxTable,
  TaxTable,
  { rejectValue: string }
>("taxTable/update", async (taxTable, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/TaxTable/${taxTable.hotelCode}`, taxTable);
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to update tax table.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateTaxTableSlice = createSlice({
  name: "updateTaxTable",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateTaxTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaxTable.fulfilled, (state, action: PayloadAction<TaxTable>) => {
        state.loading = false;
        // Add or update the tax table in store
        const index = state.data.findIndex(d => d.hotelCode === action.payload.hotelCode);
        if (index >= 0) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(updateTaxTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update tax table.";
      });
  },
});

/** ---- Exports ---- */
export default updateTaxTableSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateTaxTableLoading = (state: any) => state.updateTaxTable?.loading ?? false;
export const selectUpdateTaxTableError = (state: any) => state.updateTaxTable?.error ?? null;
export const selectUpdateTaxTableData = (state: any) => state.updateTaxTable?.data ?? [];
