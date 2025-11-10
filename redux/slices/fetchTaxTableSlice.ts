// redux/slices/fetchTaxTableSlice.ts
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

interface FetchTaxTableState {
  loading: boolean;
  error: string | null;
  data: TaxTable[];
}

const initialState: FetchTaxTableState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/TaxTable?hotelCode=... ---- */
export const fetchTaxTable = createAsyncThunk<
  TaxTable[],
  string,
  { rejectValue: string }
>("taxTable/fetch", async (hotelCode, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/TaxTable`, {
      params: { hotelCode },
    });
    return response.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to fetch tax table.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchTaxTableSlice = createSlice({
  name: "fetchTaxTable",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxTable.fulfilled, (state, action: PayloadAction<TaxTable[]>) => {
        state.loading = false;
        // Always replace data
        state.data = action.payload;
      })
      .addCase(fetchTaxTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tax table.";
      });
  },
});

/** ---- Exports ---- */
export default fetchTaxTableSlice.reducer;

/** ---- Selectors ---- */
export const selectTaxTableLoading = (state: any) => state.fetchTaxTable?.loading ?? false;
export const selectTaxTableError = (state: any) => state.fetchTaxTable?.error ?? null;
export const selectTaxTableData = (state: any) => state.fetchTaxTable?.data ?? [];
