// src/redux/slices/updateHotelTaxConfigSlice.ts
// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export type UpdateHotelTaxConfigPayload = {
  recordId: number; // required, path param {id}
  taxName: string;
  percentage: number; // 0..100 (your UI already validates)
  calcBasedOn: string; // "Base" | "SubtotalN" (send as-is)
  updatedBy?: string; // optional
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

type UpdateState = {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastUpdated: HotelTaxConfig | null;
};

/* --------------------------- Async Thunk -------------------------- */
export const updateHotelTaxConfig = createAsyncThunk<
  HotelTaxConfig,
  UpdateHotelTaxConfigPayload,
  { rejectValue: string }
>("hotelTaxConfigUpdate/update", async (payload, { rejectWithValue }) => {
  try {
    if (!BASE_URL) return rejectWithValue("API base URL is not configured.");

    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;
    if (!accessToken) return rejectWithValue("Missing access token.");

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property?.id;

    const { recordId, taxName, percentage, calcBasedOn, updatedBy, accountId } =
      payload;

    if (!recordId) return rejectWithValue("recordId is required.");
    if (!taxName?.trim()) return rejectWithValue("taxName is required.");
    if (typeof percentage !== "number")
      return rejectWithValue("percentage must be a number.");
    if (!calcBasedOn) return rejectWithValue("calcBasedOn is required.");

    const body = {
      recordId,
      hotelId, // API schema shows it; send if you have it
      taxName: taxName.trim(),
      percentage,
      accountId,
      calcBasedOn,
      updatedBy,
    };

    const resp = await axios.put(
      `${BASE_URL}/api/HotelTaxConfig/${recordId}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return resp.data as HotelTaxConfig;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update hotel tax configuration.";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: UpdateState = {
  status: "idle",
  error: null,
  lastUpdated: null,
};

const updateHotelTaxConfigSlice = createSlice({
  name: "updateHotelTaxConfig",
  initialState,
  reducers: {
    resetUpdateHotelTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelTaxConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateHotelTaxConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastUpdated = action.payload;
      })
      .addCase(updateHotelTaxConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to update tax config.";
      });
  },
});

export const { resetUpdateHotelTaxConfigState } =
  updateHotelTaxConfigSlice.actions;

/* --------------------------- Selectors --------------------------- */
export const selectUpdateTaxStatus = (state: any) =>
  state.updateHotelTaxConfig.status as UpdateState["status"];
export const selectUpdateTaxError = (state: any) =>
  state.updateHotelTaxConfig.error as string | null;
export const selectLastUpdatedTaxConfig = (state: any) =>
  state.updateHotelTaxConfig.lastUpdated as HotelTaxConfig | null;

/* ---------------------------- Reducer ---------------------------- */
export default updateHotelTaxConfigSlice.reducer;
