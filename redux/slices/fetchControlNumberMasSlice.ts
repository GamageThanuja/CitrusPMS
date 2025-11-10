import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- State ---- */
interface FetchControlNumberMasState {
  loading: boolean;
  error: string | null;
  data: string[];
}

const initialState: FetchControlNumberMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/ControlNumberMas/GetDocNo ---- */
interface FetchControlNumberMasParams {
  tranTypeId: number;
  hotelCode: string;
}

export const fetchControlNumberMas = createAsyncThunk<
  string[],
  FetchControlNumberMasParams,
  { rejectValue: string }
>("controlNumberMas/fetch", async (params, { rejectWithValue }) => {
  try {
    const { tranTypeId, hotelCode } = params;
    const response = await axios.get(`${API_BASE_URL}/api/ControlNumberMas/GetDocNo`, {
      params: { tranTypeId, hotelCode },
    });
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch control number.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchControlNumberMasSlice = createSlice({
  name: "fetchControlNumberMas",
  initialState,
  reducers: {
    resetControlNumberMasState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchControlNumberMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchControlNumberMas.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchControlNumberMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch control number.";
      });
  },
});

/** ---- Exports ---- */
export const { resetControlNumberMasState } = fetchControlNumberMasSlice.actions;
export default fetchControlNumberMasSlice.reducer;

/** ---- Selectors ---- */
export const selectControlNumberMasLoading = (state: any) =>
  (state.fetchControlNumberMas?.loading as boolean) ?? false;
export const selectControlNumberMasError = (state: any) =>
  (state.fetchControlNumberMas?.error as string | null) ?? null;
export const selectControlNumberMasData = (state: any) =>
  (state.fetchControlNumberMas?.data as string[]) ?? [];
