// redux/slices/fetchGLAccountSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface GLAccount {
  accountID: number;
  accountTypeID: number;
  accountCode: string;
  accountName: string;
  description: string;
  accDetailTypeID: number;
  finAct: boolean;
  hotelID: string;
}

interface FetchGLAccountState {
  loading: boolean;
  error: string | null;
  data: GLAccount[];
}

const initialState: FetchGLAccountState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/GLAccount?filter=... ---- */
export const fetchGLAccount = createAsyncThunk<
  GLAccount[],
  string | undefined,
  { rejectValue: string }
>("glAccount/fetch", async (filter, { rejectWithValue }) => {
  try {
    const response = await axios.get<GLAccount[]>(
      `${API_BASE_URL}/api/GLAccount`,
      {
        // only send params if filter is provided
        params: filter ? { filter } : undefined,
      }
    );
    return response.data || [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch GL accounts.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchGLAccountSlice = createSlice({
  name: "fetchGLAccount",
  initialState,
  reducers: {
    clearGLAccount(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGLAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchGLAccount.fulfilled,
        (state, action: PayloadAction<GLAccount[]>) => {
          state.loading = false;
          state.data = action.payload || [];
        }
      )
      .addCase(fetchGLAccount.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch GL accounts.";
      });
  },
});

/** ---- Exports ---- */
export const { clearGLAccount } = fetchGLAccountSlice.actions;
export default fetchGLAccountSlice.reducer;

/** ---- Selectors ---- */
export const selectGLAccountLoading = (state: any) =>
  state.fetchGLAccount?.loading ?? false;

export const selectGLAccountError = (state: any) =>
  state.fetchGLAccount?.error ?? null;

export const selectGLAccountData = (state: any) =>
  (state.fetchGLAccount?.data as GLAccount[]) ?? [];