// @redux/slices/glAccountsByTypeSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface GlAccount {
  accountID: number;
  accountTypeID: number;
  accountCode: string;
  accountName: string;
  description: string | null;
  accDetailTypeID: number | null;
  finAct: boolean;
  hotelID: string;
}

interface GlAccountState {
  glAccounts: GlAccount[];
  loading: boolean;
  error: string | null;
}

const initialState: GlAccountState = {
  glAccounts: [],
  loading: false,
  error: null,
};

export const fetchGlAccountsByType = createAsyncThunk<
  GlAccount[],
  number,
  { rejectValue: string }
>("glAccounts/fetchByType", async (accountTypeId, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsed?.accessToken;

    const response = await axios.get(
      `${BASE_URL}/api/GlAccount/byAccountType/${accountTypeId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.detail || "Failed to fetch GL accounts"
    );
  }
});

const glAccountsByTypeSlice = createSlice({
  name: "glAccountsByType",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlAccountsByType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlAccountsByType.fulfilled, (state, action) => {
        state.loading = false;
        state.glAccounts = action.payload;
      })
      .addCase(fetchGlAccountsByType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export default glAccountsByTypeSlice.reducer;
