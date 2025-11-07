// @ts-nocheck
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
/** API return type */
export interface ReportMasterItem {
  reportID: number;
  finAct: boolean;
  reportCategory: string; // e.g., "GRC"
  reportName: string; // e.g., "GRC1"
  engine: string; // e.g., "CR"
  reportURL: string; // e.g., "https://reports2.hotelmate.app/Reservation/GRC1.aspx"
}

interface ReportMasterState {
  /** Cached by category, e.g. data["GRC"] = ReportMasterItem[] */
  data: Record<string, ReportMasterItem[]>;
  /** Loading state per category */
  loadingByCategory: Record<string, boolean>;
  /** Error state per category */
  errorByCategory: Record<string, string | null>;
}

const initialState: ReportMasterState = {
  data: {},
  loadingByCategory: {},
  errorByCategory: {},
};

/**
 * Fetch reports by category (e.g. "GRC")
 * Usage: dispatch(fetchReportMasterByCategory({ reportCategory: "GRC" }))
 */
export const fetchReportMasterByCategory = createAsyncThunk<
  { reportCategory: string; items: ReportMasterItem[] },
  { reportCategory: string }
>(
  "reportMaster/fetchByCategory",
  async ({ reportCategory }, { rejectWithValue }) => {
    try {
      // Read localStorage inside the thunk (avoids SSR issues)
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken as string | undefined;

      // Optional: read selected property (not used by this endpoint, but kept for parity)
      const selectedProperty =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedProperty")
          : null;
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property?.id; // not used by /ReportMaster/category/{cat}

      if (!accessToken) {
        return rejectWithValue("Missing access token");
      }

      const url = `${API_BASE_URL}/api/ReportMaster/category/${encodeURIComponent(
        reportCategory
      )}`;

      const res = await axios.get<ReportMasterItem[]>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json, text/plain",
        },
      });

      return { reportCategory, items: res.data ?? [] };
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        "Failed to fetch reports";
      return rejectWithValue(msg);
    }
  }
);

const reportMasterSlice = createSlice({
  name: "reportMaster",
  initialState,
  reducers: {
    clearCategory(state, action: PayloadAction<{ reportCategory: string }>) {
      const { reportCategory } = action.payload;
      delete state.data[reportCategory];
      delete state.loadingByCategory[reportCategory];
      delete state.errorByCategory[reportCategory];
    },
    clearAll(state) {
      state.data = {};
      state.loadingByCategory = {};
      state.errorByCategory = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportMasterByCategory.pending, (state, action) => {
        const cat = action.meta.arg.reportCategory;
        state.loadingByCategory[cat] = true;
        state.errorByCategory[cat] = null;
      })
      .addCase(fetchReportMasterByCategory.fulfilled, (state, action) => {
        const { reportCategory, items } = action.payload;
        state.data[reportCategory] = items;
        state.loadingByCategory[reportCategory] = false;
        state.errorByCategory[reportCategory] = null;
      })
      .addCase(fetchReportMasterByCategory.rejected, (state, action) => {
        const cat = action.meta.arg.reportCategory;
        state.loadingByCategory[cat] = false;
        state.errorByCategory[cat] =
          (action.payload as string) || action.error.message || "Error";
      });
  },
});

export const { clearCategory, clearAll } = reportMasterSlice.actions;
export default reportMasterSlice.reducer;

// selectors — add these to reportMasterSlice.ts
export const selectReportsByCategory = (state: any, reportCategory: string) =>
  state.reportMaster?.data?.[reportCategory] ?? [];

export const selectReportLoading = (state: any, reportCategory: string) =>
  !!state.reportMaster?.loadingByCategory?.[reportCategory];

export const selectReportError = (state: any, reportCategory: string) =>
  state.reportMaster?.errorByCategory?.[reportCategory] ?? null;
