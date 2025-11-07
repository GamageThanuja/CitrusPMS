import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface GlAccount {
  accountID: number;
  accountTypeID: number;
  accountCode: string;
  accountName: string;
  description: string;
  accDetailTypeID: number;
  finAct: boolean;
  hotelID: string;
}

interface GlAccountState {
  loading: boolean;
  error: string | null;
  data: GlAccount | null;
  list: GlAccount[]; // for fetched account list
  listLoading: boolean;
  listError: string | null;
}

const initialState: GlAccountState = {
  loading: false,
  error: null,
  data: null,
  list: [],
  listLoading: false,
  listError: null,
};

// POST - Create GL Account
export const createGlAccount = createAsyncThunk(
  "glAccount/create",
  async (payload: Omit<GlAccount, "accountID">, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.post(`${BASE_URL}/api/GlAccount`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Error occurred");
    }
  }
);

// GET - Fetch all GL Accounts
export const fetchGlAccounts = createAsyncThunk(
  "glAccount/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.get(`${BASE_URL}/api/GlAccount`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      });

      return response.data as GlAccount[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Error fetching GL accounts"
      );
    }
  }
);

const glAccountSlice = createSlice({
  name: "glAccount",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // POST
      .addCase(createGlAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGlAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createGlAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // GET
      .addCase(fetchGlAccounts.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchGlAccounts.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchGlAccounts.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      });
  },
});

export default glAccountSlice.reducer;

export const selectGlAccountList = (s: RootState) => s.glAccount.list;
export const selectGlAccountListLoading = (s: RootState) =>
  s.glAccount.listLoading;
export const selectGlAccountListError = (s: RootState) => s.glAccount.listError;
