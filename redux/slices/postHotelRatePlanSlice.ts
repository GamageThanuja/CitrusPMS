// @ts-nocheck
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
/**
 * postHotelRatePlan(payload, { autoFillHotelId })
 * - payload: pass EXACTLY the object you showed (with nested hotelMaster, rateCode, hotelRoomType, etc.)
 * - options.autoFillHotelId = true (default): If payload.hotelID === 0, pull id from localStorage.selectedProperty
 */
export const postHotelRatePlan = createAsyncThunk<
  any, // server response
  { payload: any; options?: { autoFillHotelId?: boolean; isUpdate?: boolean } },
  { state: RootState }
>("hotelRatePlans/post", async ({ payload, options }, thunkAPI) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;
    if (!accessToken) throw new Error("Missing access token");

    const autoFillHotelId = options?.autoFillHotelId ?? true;
    const isUpdate = options?.isUpdate ?? false;

    // Optionally auto-fill hotelID if it's 0
    if (autoFillHotelId && Number(payload?.hotelID) === 0) {
      const selectedPropertyRaw = localStorage.getItem("selectedProperty");
      const property = selectedPropertyRaw
        ? JSON.parse(selectedPropertyRaw)
        : {};
      const hotelId = property?.id ?? property?.hotelID;
      if (hotelId) {
        payload = { ...payload, hotelID: Number(hotelId) };
      }
    }

    const res = await axios.post(
      `${API_BASE_URL}/api/HotelRatePlans?isUpdate=${isUpdate}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Some APIs return 201 (Created). Axios treats 2xx as success by default.
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    return res.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue({
      message:
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create hotel rate plan",
      status: err?.response?.status ?? null,
      raw: err?.response?.data ?? null,
    });
  }
});

type PostState = {
  loading: boolean;
  error: null | { message: string; status?: number; raw?: any };
  data: any | null;
};

const initialState: PostState = {
  loading: false,
  error: null,
  data: null,
};

const postHotelRatePlanSlice = createSlice({
  name: "postHotelRatePlan",
  initialState,
  reducers: {
    resetPostHotelRatePlan: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(postHotelRatePlan.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(
        postHotelRatePlan.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(postHotelRatePlan.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload || { message: "Unknown error" };
      });
  },
});

export const { resetPostHotelRatePlan } = postHotelRatePlanSlice.actions;
export default postHotelRatePlanSlice.reducer;

// Selectors
export const selectPostHotelRatePlan = (s: RootState) => s.postHotelRatePlan;
