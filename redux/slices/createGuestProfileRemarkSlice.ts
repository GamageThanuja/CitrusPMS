// redux/slices/createGuestProfileRemarkSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface GuestProfileRemarkPayload {
  guestProfileId: number;
  finAct: boolean;
  remarks: string;
  createdBy: string;
}

interface GuestProfileRemarkState {
  loading: boolean;
  error: string | null;
  success: boolean;
  response: any;
}

const initialState: GuestProfileRemarkState = {
  loading: false,
  error: null,
  success: false,
  response: null,
};

export const createGuestProfileRemark = createAsyncThunk(
  "guestProfileRemark/create",
  async (payload: GuestProfileRemarkPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.post(
        `${BASE_URL}/api/GuestProfileRemark`,
        { ...payload },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "x-hotel-id": hotelId,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const guestProfileRemarkSlice = createSlice({
  name: "guestProfileRemark",
  initialState,
  reducers: {
    resetGuestProfileRemarkState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGuestProfileRemark.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createGuestProfileRemark.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.response = action.payload;
      })
      .addCase(createGuestProfileRemark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetGuestProfileRemarkState } = guestProfileRemarkSlice.actions;
export default guestProfileRemarkSlice.reducer;
