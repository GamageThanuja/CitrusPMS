// redux/slices/createTaxTableSlice.ts
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

interface CreateTaxTableState {
  loading: boolean;
  error: string | null;
  data: TaxTable[];
}

const initialState: CreateTaxTableState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: POST /api/TaxTable ---- */
export const createTaxTable = createAsyncThunk<
  TaxTable,
  TaxTable,
  { rejectValue: string }
>("taxTable/create", async (taxTable, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/TaxTable`, taxTable);
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to create tax table.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createTaxTableSlice = createSlice({
  name: "createTaxTable",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createTaxTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTaxTable.fulfilled, (state, action: PayloadAction<TaxTable>) => {
        state.loading = false;
        // Always add new tax table to store
        state.data.push(action.payload);
      })
      .addCase(createTaxTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create tax table.";
      });
  },
});

/** ---- Exports ---- */
export default createTaxTableSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateTaxTableLoading = (state: any) => state.createTaxTable?.loading ?? false;
export const selectCreateTaxTableError = (state: any) => state.createTaxTable?.error ?? null;
export const selectCreateTaxTableData = (state: any) => state.createTaxTable?.data ?? [];
