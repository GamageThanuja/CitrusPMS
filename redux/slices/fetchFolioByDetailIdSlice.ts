// redux/slices/fetchFolioByDetailIdSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface FolioItem {
  accountsTranID: number;
  finAct: boolean;
  tranMasId: number;
  hotelCode: number; // API returns 0 in sample, so number
  tranTypeId: number;
  tranType: string;
  reservationId: number;
  reservationDetailId: number;
  accountCode: string;
  accountName: string;
  tranDate: string;        // ISO string
  docNo: string;
  effectiveDate: string;   // ISO string
  comment: string;
  amount: number;
  debit: number;
  credit: number;
  invoiceType: string;
  paymentMethod: string;
  posCenter: string;
}

interface FetchFolioByDetailIdState {
  loading: boolean;
  error: string | null;
  data: FolioItem[];
}

const initialState: FetchFolioByDetailIdState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/Folio/{reservationDetailId} ---- */
export const fetchFolioByDetailId = createAsyncThunk<
  FolioItem[],
  number,
  { rejectValue: string }
>("folioByDetailId/fetch", async (reservationDetailId, { rejectWithValue }) => {
  try {
    const response = await axios.get<FolioItem[]>(
      `${API_BASE_URL}/api/Folio/${reservationDetailId}`
    );
    return response.data || [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch folio.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchFolioByDetailIdSlice = createSlice({
  name: "fetchFolioByDetailId",
  initialState,
  reducers: {
    clearFolioByDetailId(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolioByDetailId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFolioByDetailId.fulfilled,
        (state, action: PayloadAction<FolioItem[]>) => {
          state.loading = false;
          state.data = action.payload || [];
        }
      )
      .addCase(fetchFolioByDetailId.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch folio.";
      });
  },
});

/** ---- Exports ---- */
export const { clearFolioByDetailId } = fetchFolioByDetailIdSlice.actions;
export default fetchFolioByDetailIdSlice.reducer;

/** ---- Selectors ---- */
export const selectFolioByDetailIdLoading = (state: any) =>
  state.fetchFolioByDetailId?.loading ?? false;

export const selectFolioByDetailIdError = (state: any) =>
  state.fetchFolioByDetailId?.error ?? null;

export const selectFolioByDetailIdData = (state: any) =>
  state.fetchFolioByDetailId?.data ?? [];