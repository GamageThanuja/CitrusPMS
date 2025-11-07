// src/redux/slices/hotelTaxConfigSlice.ts
// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export type HotelTaxConfig = {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string; // e.g., "Amount", "Subtotal", "ServiceCharge", etc.
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
};

type HotelTaxConfigState = {
  items: HotelTaxConfig[];
  loading: boolean;
  error: string | null;
};

/* --------------------------- Async Thunk -------------------------- */
export const fetchHotelTaxConfigs = createAsyncThunk<
  HotelTaxConfig[],
  void,
  { rejectValue: string }
>("hotelTaxConfig/fetchByHotel", async (_void, { rejectWithValue }) => {
  try {
    // tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // property / hotel id
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property?.id;

    if (!BASE_URL) {
      return rejectWithValue("API base URL is not configured.");
    }
    if (!accessToken) {
      return rejectWithValue("Missing access token.");
    }
    if (!hotelId) {
      return rejectWithValue("Missing selected property (hotelId).");
    }

    const resp = await axios.get(
      `${BASE_URL}/api/HotelTaxConfig/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    // Expecting an array from API
    return Array.isArray(resp.data) ? resp.data : [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch hotel tax configurations.";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: HotelTaxConfigState = {
  items: [],
  loading: false,
  error: null,
};

const hotelTaxConfigSlice = createSlice({
  name: "hotelTaxConfig",
  initialState,
  reducers: {
    resetHotelTaxConfigs: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelTaxConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelTaxConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload ?? [];
      })
      .addCase(fetchHotelTaxConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load tax configs.";
      });
  },
});

export const { resetHotelTaxConfigs } = hotelTaxConfigSlice.actions;

/* --------------------------- Selectors --------------------------- */
export const selectHotelTaxConfigs = (state: any) =>
  state.hotelTaxConfig.items as HotelTaxConfig[];
export const selectHotelTaxConfigsLoading = (state: any) =>
  state.hotelTaxConfig.loading as boolean;
export const selectHotelTaxConfigsError = (state: any) =>
  state.hotelTaxConfig.error as string | null;

/* ---------------------------- Reducer ---------------------------- */
export default hotelTaxConfigSlice.reducer;
