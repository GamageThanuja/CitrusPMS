// redux/slices/fetchGLAccountTypeSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface GLAccountType {
  accountTypeID: number;
  accountType: string;
  seq: number;
  nextCode: string;
}

interface FetchGLAccountTypeState {
  loading: boolean;
  error: string | null;
  data: GLAccountType[];
}

const initialState: FetchGLAccountTypeState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/GLAccountType ---- */
export const fetchGLAccountType = createAsyncThunk<
  GLAccountType[],
  void,
  { rejectValue: string }
>("glAccountType/fetch", async (_arg, { rejectWithValue }) => {
  try {
    const response = await axios.get<GLAccountType[]>(
      `${API_BASE_URL}/api/GLAccountType`
    );
    return response.data || [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch GL account types.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchGLAccountTypeSlice = createSlice({
  name: "fetchGLAccountType",
  initialState,
  reducers: {
    clearGLAccountType(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGLAccountType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchGLAccountType.fulfilled,
        (state, action: PayloadAction<GLAccountType[]>) => {
          state.loading = false;
          state.data = action.payload || [];
        }
      )
      .addCase(fetchGLAccountType.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch GL account types.";
      });
  },
});

/** ---- Exports ---- */
export const { clearGLAccountType } = fetchGLAccountTypeSlice.actions;
export default fetchGLAccountTypeSlice.reducer;

/** ---- Selectors ---- */
export const selectGLAccountTypeLoading = (state: any) =>
  state.fetchGLAccountType?.loading ?? false;

export const selectGLAccountTypeError = (state: any) =>
  state.fetchGLAccountType?.error ?? null;

export const selectGLAccountTypeData = (state: any) =>
  state.fetchGLAccountType?.data ?? [];