// src/redux/slices/taxConfigByCountrySlice.ts
// @ts-nocheck
import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export type CountryTaxRow = {
  taxConfigMasId: number;
  countryCode: string; // e.g., "LK", "IT"
  province: string; // e.g., "ANY"
  finAct: boolean; // financial act flag from API
  taxCompenent: string; // (note API uses "taxCompenent")
  taxPercentage: number | null;
  calcBasedOn: string | null; // sometimes "BASE      " (padded) or null
  example: number | null;
  accountId: number | null;
};

type State = {
  items: CountryTaxRow[];
  loading: boolean;
  error: string | null;
};

/* --------------------------- Async Thunk -------------------------- */
export const fetchTaxConfigByCountry = createAsyncThunk<
  CountryTaxRow[],
  void,
  { rejectValue: string }
>("taxConfigByCountry/fetch", async (_void, { rejectWithValue }) => {
  try {
    // 1) Token
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // 2) property available if you want to derive a default country in UI
    // const selectedProperty = localStorage.getItem("selectedProperty");
    // const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    // const hotelId = property?.id;

    if (!BASE_URL) return rejectWithValue("API base URL is not configured.");
    if (!accessToken) return rejectWithValue("Missing access token.");

    const resp = await axios.get(`${BASE_URL}/api/Tax/config-by-country`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const data = Array.isArray(resp.data) ? resp.data : [];

    // Normalize a couple of fields (trim calcBasedOn and taxCompenent)
    const normalized = data.map((r: any) => ({
      ...r,
      calcBasedOn:
        typeof r.calcBasedOn === "string"
          ? r.calcBasedOn.trim()
          : r.calcBasedOn,
      taxCompenent:
        typeof r.taxCompenent === "string"
          ? r.taxCompenent.trim()
          : r.taxCompenent,
    }));

    return normalized;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to fetch tax config by country.";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const taxConfigByCountrySlice = createSlice({
  name: "taxConfigByCountry",
  initialState,
  reducers: {
    resetTaxConfigByCountry: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxConfigByCountry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxConfigByCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload ?? [];
      })
      .addCase(fetchTaxConfigByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load country tax config.";
      });
  },
});

export const { resetTaxConfigByCountry } = taxConfigByCountrySlice.actions;

/* --------------------------- Selectors --------------------------- */
export const selectCountryTaxAll = (state: any) =>
  state.taxConfigByCountry.items as CountryTaxRow[];

export const selectCountryTaxLoading = (state: any) =>
  state.taxConfigByCountry.loading as boolean;

export const selectCountryTaxError = (state: any) =>
  state.taxConfigByCountry.error as string | null;

/** Filter by country code (e.g., "LK") */
export const makeSelectCountryTaxByCode = (countryCode: string) =>
  createSelector([selectCountryTaxAll], (all) =>
    all.filter(
      (r) => r.countryCode?.toUpperCase() === countryCode?.toUpperCase()
    )
  );

/** Group by country for quick lookups */
export const selectCountryTaxGrouped = createSelector(
  [selectCountryTaxAll],
  (all) =>
    all.reduce<Record<string, CountryTaxRow[]>>((acc, row) => {
      const key = (row.countryCode || "UNKNOWN").toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {})
);

/* ---------------------------- Reducer ---------------------------- */
export default taxConfigByCountrySlice.reducer;
