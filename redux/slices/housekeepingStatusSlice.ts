// src/redux/slices/housekeepingStatusSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type UpdateHousekeepingPayload = {
  id: number; // room number id (path param)
  housekeepingStatus: string; // body param
};

type HousekeepingState = {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastResponse?: any;
};

const initialState: HousekeepingState = {
  loading: false,
  error: null,
  success: false,
};

export const updateHousekeepingStatus = createAsyncThunk<
  any, // API response type
  UpdateHousekeepingPayload,
  { rejectValue: string }
>(
  "housekeeping/updateStatus",
  async ({ id, housekeepingStatus }, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!accessToken) {
        return rejectWithValue("No access token found");
      }

      const response = await axios.put(
        `${BASE_URL}/api/HotelRoomNumber/${id}/housekeeping-status`,
        { housekeepingStatus },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            hotelId, // attach hotelId if API expects it as query param
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const msg =
        error.response?.data?.detail ||
        error.message ||
        "Failed to update housekeeping status";
      return rejectWithValue(msg);
    }
  }
);

const housekeepingStatusSlice = createSlice({
  name: "housekeepingStatus",
  initialState,
  reducers: {
    resetHousekeepingState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHousekeepingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateHousekeepingStatus.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.lastResponse = action.payload;
        }
      )
      .addCase(updateHousekeepingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
        state.success = false;
      });
  },
});

export const { resetHousekeepingState } = housekeepingStatusSlice.actions;
export default housekeepingStatusSlice.reducer;
