// src/redux/slices/postHotelTaxConfigSlice.ts
// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export type PostHotelTaxConfigPayload = {
  hotelId?: number; // optional; falls back to selectedProperty.id
  taxName: string;
  percentage: number; // e.g., 10, 12.5, 100
  calcBasedOn: string; // e.g., "Subtotal", "Amount", "ServiceCharge"
  createdBy?: string; // optional if API fills from token
  accountId?: number;
};

export type HotelTaxConfig = {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  accountId?: number;
};

type PostState = {
  creating: boolean;
  error: string | null;
  lastCreated: HotelTaxConfig | null;
};

/* --------------------------- Async Thunk -------------------------- */
export const postHotelTaxConfig = createAsyncThunk<
  HotelTaxConfig,
  PostHotelTaxConfigPayload,
  { rejectValue: string }
>("postHotelTaxConfig/create", async (payload, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const fallbackHotelId = property?.id;

    if (!BASE_URL) return rejectWithValue("API base URL is not configured.");
    if (!accessToken) return rejectWithValue("Missing access token.");

    const body = {
      hotelId: payload.hotelId ?? fallbackHotelId,
      taxName: payload.taxName,
      accountId: payload.accountId,
      percentage: payload.percentage,
      calcBasedOn: payload.calcBasedOn,
      createdBy: payload.createdBy,
    };

    if (!body.hotelId)
      return rejectWithValue("Missing hotelId (no selected property found).");
    if (!body.taxName) return rejectWithValue("taxName is required.");
    if (typeof body.percentage !== "number")
      return rejectWithValue("percentage must be a number.");
    if (!body.calcBasedOn) return rejectWithValue("calcBasedOn is required.");

    const resp = await axios.post(`${BASE_URL}/api/HotelTaxConfig`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return resp.data as HotelTaxConfig;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create hotel tax configuration.";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: PostState = {
  creating: false,
  error: null,
  lastCreated: null,
};

const postHotelTaxConfigSlice = createSlice({
  name: "postHotelTaxConfig",
  initialState,
  reducers: {
    resetPostHotelTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(postHotelTaxConfig.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(postHotelTaxConfig.fulfilled, (state, action) => {
        state.creating = false;
        state.lastCreated = action.payload;
      })
      .addCase(postHotelTaxConfig.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Unable to create tax config.";
      });
  },
});

export const { resetPostHotelTaxConfigState } = postHotelTaxConfigSlice.actions;

/* --------------------------- Selectors --------------------------- */
export const selectPostTaxCreating = (state: any) =>
  state.postHotelTaxConfig.creating as boolean;
export const selectPostTaxError = (state: any) =>
  state.postHotelTaxConfig.error as string | null;
export const selectPostLastCreatedTax = (state: any) =>
  state.postHotelTaxConfig.lastCreated as HotelTaxConfig | null;

/* ---------------------------- Reducer ---------------------------- */
export default postHotelTaxConfigSlice.reducer;
