// src/redux/slices/updateReservationSlice.ts
// @ts-nocheck
"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

type UpdateReservationArgs = {
  reservationId: number;
  data: any; // shape is API DTO — pass only fields you intend to update
};

type UpdateReservationState = {
  loading: boolean;
  success: boolean;
  error: string | null;
  result: any | null;
};

const initialState: UpdateReservationState = {
  loading: false,
  success: false,
  error: null,
  result: null,
};

// If you prefer, extract this to an env var.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const updateReservationMaster = createAsyncThunk<
  any,
  UpdateReservationArgs,
  { rejectValue: string }
>("reservation/updateMaster", async (args, { rejectWithValue }) => {
  const { reservationId, data } = args;

  // --- tokens ---
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken = parsedToken?.accessToken;

  if (!accessToken) {
    return rejectWithValue("Missing access token");
  }

  // --- hotel id -> hotelCode ---
  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId = property?.id;

  // The API expects hotelCode (number). Ensure we send it (do not override if caller set one explicitly).
  const body = {
    ...(data || {}),
    hotelCode: data?.hotelCode ?? Number(hotelId ?? 0),
  };

  try {
    const res = await fetch(`${API_BASE}/api/Reservation/${reservationId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Try to surface API problem details if present
      const txt = await res.text();
      try {
        const maybeJson = JSON.parse(txt);
        const msg =
          maybeJson?.detail ||
          maybeJson?.title ||
          `HTTP ${res.status} ${res.statusText}`;
        return rejectWithValue(msg);
      } catch {
        return rejectWithValue(
          `HTTP ${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`
        );
      }
    }

    const json = await res.json().catch(() => ({}));
    return json;
  } catch (e: any) {
    return rejectWithValue(e?.message || "Network error");
  }
});

const updateReservationSlice = createSlice({
  name: "updateReservation",
  initialState,
  reducers: {
    clearUpdateReservationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.result = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateReservationMaster.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateReservationMaster.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.result = action.payload;
      })
      .addCase(updateReservationMaster.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Update failed";
      });
  },
});

export const { clearUpdateReservationState } = updateReservationSlice.actions;

export default updateReservationSlice.reducer;
