import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk
export const createPosOrder = createAsyncThunk(
  "posOrder/createPosOrder",
  async (payload: any, { rejectWithValue }) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/Pos/CreatePosOrder`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

interface PosOrderState {
  loading: boolean;
  error: string | null;
  data: any;
}

const initialState: PosOrderState = {
  loading: false,
  error: null,
  data: null,
};

const posOrderSlice = createSlice({
  name: "posOrder",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPosOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPosOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createPosOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default posOrderSlice.reducer;
