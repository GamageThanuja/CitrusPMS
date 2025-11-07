// src/redux/slices/updateHotelRatePlanSlice.ts
// @ts-nocheck
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import type { RootState } from "../store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UpdateArgs = {
  hotelRatePlanId: number | string;
  payload: any; // Use your typed interface here if you have one
  options?: {
    /** If payload.hotelID is falsy or 0, pull from localStorage.selectedProperty.id (default: true) */
    autoFillHotelId?: boolean;
  };
};

type UpdateState = {
  data: any | null;
  loading: boolean;
  error: string | null;
};

const initialState: UpdateState = {
  data: null,
  loading: false,
  error: null,
};

export const updateHotelRatePlan = createAsyncThunk<
  any,
  UpdateArgs,
  { state: RootState }
>(
  "hotelRatePlans/update",
  async ({ hotelRatePlanId, payload, options }, thunkAPI) => {
    try {
      // ---- tokens
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // ---- property
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property?.id;

      // ---- optional auto-fill of hotelID if needed
      const shouldAutoFill = options?.autoFillHotelId ?? true;
      const finalPayload = { ...payload };
      if (
        shouldAutoFill &&
        (!finalPayload.hotelID || finalPayload.hotelID === 0)
      ) {
        if (hotelId) finalPayload.hotelID = hotelId;
      }

      const url = `${API_BASE_URL}/api/HotelRatePlans/${hotelRatePlanId}`;
      const res = await axios.put(url, finalPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return res.data;
    } catch (err) {
      const axErr = err as AxiosError<any>;
      const message =
        axErr.response?.data?.message ||
        axErr.response?.data?.title ||
        axErr.message ||
        "Failed to update hotel rate plan";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const updateHotelRatePlanSlice = createSlice({
  name: "hotelRatePlans/update",
  initialState,
  reducers: {
    resetUpdateHotelRatePlan: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelRatePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateHotelRatePlan.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateHotelRatePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Request failed";
      });
  },
});

export const { resetUpdateHotelRatePlan } = updateHotelRatePlanSlice.actions;

// ---- selectors
export const selectUpdateHotelRatePlan = (state: RootState) =>
  state.updateHotelRatePlan;
export const selectUpdateHotelRatePlanLoading = (state: RootState) =>
  state.updateHotelRatePlan.loading;
export const selectUpdateHotelRatePlanError = (state: RootState) =>
  state.updateHotelRatePlan.error;
export const selectUpdatedRatePlanData = (state: RootState) =>
  state.updateHotelRatePlan.data;

export default updateHotelRatePlanSlice.reducer;
