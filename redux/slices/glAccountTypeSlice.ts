import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface GlAccountType {
  accountTypeID: number;
  accountType: string;
  seq: number | null;
  nextCode: string;
}

interface GlAccountTypeState {
  data: GlAccountType[];
  loading: boolean;
  error: string | null;
}

const initialState: GlAccountTypeState = {
  data: [],
  loading: false,
  error: null,
};

// Async thunk to fetch GL Account Types
export const fetchGlAccountTypes = createAsyncThunk(
  "glAccountType/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.get(`${BASE_URL}/api/GlAccountType`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      });

      return response.data as GlAccountType[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to fetch account types"
      );
    }
  }
);

const glAccountTypeSlice = createSlice({
  name: "glAccountType",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlAccountTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlAccountTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGlAccountTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default glAccountTypeSlice.reducer;
