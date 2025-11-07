import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const postCharges = createAsyncThunk(
  "reservation/postCharges",
  async (chargeData: any, { rejectWithValue }) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/Reservation/post-charges`,
        chargeData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue(err.message);
    }
  }
);

interface PostChargesState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: PostChargesState = {
  loading: false,
  success: false,
  error: null,
};

const postChargesSlice = createSlice({
  name: "postCharges",
  initialState,
  reducers: {
    resetPostChargesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postCharges.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(postCharges.fulfilled, (state, action) => {
        console.log("✅ POST SUCCESS:", action.payload);
        state.loading = false;
        state.success = true;
        state.error = null;
      })

      .addCase(postCharges.rejected, (state, action) => {
        console.error("❌ POST ERROR:", action.payload);
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetPostChargesState } = postChargesSlice.actions;

export default postChargesSlice.reducer;
