// redux/slices/nightAuditSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---- Types ----
export type NightAuditUpdateDto = {
  hotelId: number;
  nightAuditDate: string; // ISO string (e.g., "2025-10-17T00:00:00.000Z")
  updatedBy: string;
};

export type NightAuditState = {
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
  // the latest value we believe the server has after a successful update
  current?: {
    hotelId: number;
    nightAuditDate: string; // ISO
    updatedBy?: string;
  } | null;
  // when we last successfully updated
  lastUpdatedAt?: string | null;
};

// ---- Initial ----
const initialState: NightAuditState = {
  status: "idle",
  error: null,
  current: null,
  lastUpdatedAt: null,
};

// ---- Thunk ----
/**
 * Updates the Night Audit Date for the selected hotel.
 * Pulls `accessToken` from localStorage.hotelmateTokens and `hotelId` from localStorage.selectedProperty.
 */
export const updateNightAuditDate = createAsyncThunk<
  // Return type of the payload creator
  { hotelId: number; nightAuditDate: string; updatedBy?: string },
  // First argument to the payload creator
  { nightAuditDate: string; updatedBy: string },
  // ThunkApi config for rejectWithValue typing
  { rejectValue: string }
>("nightAudit/updateNightAuditDate", async (args, { rejectWithValue }) => {
  try {
    // --- Auth token ---
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;
    if (!accessToken) return rejectWithValue("Missing access token.");

    // --- Hotel ID ---
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;
    if (!hotelId) return rejectWithValue("Hotel ID not found in localStorage.");

    const dto: NightAuditUpdateDto = {
      hotelId,
      nightAuditDate: args.nightAuditDate,
      updatedBy: args.updatedBy,
    };

    const url = `${BASE_URL}/api/NightAudit/UpdateNightAuditDate`;
    const { data } = await axios.put(url, dto, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Some APIs echo the DTO back; others return a wrapper/void.
    // We'll safely fall back to our DTO if server returns nothing useful.
    const result =
      data && (data.hotelId || data.nightAuditDate)
        ? {
            hotelId: data.hotelId,
            nightAuditDate: data.nightAuditDate,
            updatedBy: data.updatedBy,
          }
        : dto;

    return result;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update Night Audit Date.";
    return rejectWithValue(String(msg));
  }
});

// ---- Slice ----
const nightAuditSlice = createSlice({
  name: "nightAudit",
  initialState,
  reducers: {
    // optional: set locally without hitting API (e.g., UI preview)
    setLocalNightAuditDate(
      state,
      action: PayloadAction<{
        hotelId: number;
        nightAuditDate: string;
        updatedBy?: string;
      }>
    ) {
      state.current = action.payload;
    },
    resetNightAuditState(state) {
      state.status = "idle";
      state.error = null;
      state.lastUpdatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateNightAuditDate.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateNightAuditDate.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = {
          hotelId: action.payload.hotelId,
          nightAuditDate: action.payload.nightAuditDate,
          updatedBy: action.payload.updatedBy,
        };
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(updateNightAuditDate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const { setLocalNightAuditDate, resetNightAuditState } =
  nightAuditSlice.actions;
export default nightAuditSlice.reducer;

// ---- Selectors ----
export const selectNightAudit = (state: RootState) => state.nightAudit;
export const selectNightAuditStatus = (state: RootState) =>
  state.nightAudit.status;
export const selectNightAuditError = (state: RootState) =>
  state.nightAudit.error;
export const selectNightAuditCurrent = (state: RootState) =>
  state.nightAudit.current;
