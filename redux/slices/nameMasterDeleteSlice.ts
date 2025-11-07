"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

type DeleteState = {
  loading: boolean;
  error: string | null;
  lastDeletedId: number | null;
};

const initialState: DeleteState = {
  loading: false,
  error: null,
  lastDeletedId: null,
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * DELETE /api/NameMaster/{id}
 * Returns 204 No Content on success.
 */
export const deleteNameMasterById = createAsyncThunk<
  // Return type of the payload creator
  { id: number },
  // First argument to the payload creator
  number,
  // ThunkApi config
  {
    rejectValue: string;
  }
>("nameMaster/deleteById", async (id, { rejectWithValue }) => {
  if (!BASE_URL) {
    return rejectWithValue("API base URL is not configured.");
  }

  // Pull tokens & selected property from localStorage (per your pattern)
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId = property?.id as string | number | undefined;

  if (!accessToken) {
    return rejectWithValue("Unauthorized: missing access token.");
  }

  const url = `${BASE_URL}/api/NameMaster/${id}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    // If your API expects hotel context in a header, keep this line.
    ...(hotelId ? { "X-Hotel-Id": String(hotelId) } : {}),
  };

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    // 204 No Content -> success
    if (res.status === 204) {
      return { id };
    }

    // Common error mapping
    if (res.status === 401) {
      return rejectWithValue("Unauthorized (401). Please sign in again.");
    }
    if (res.status === 404) {
      return rejectWithValue(`NameMaster id ${id} not found (404).`);
    }

    // Try to extract problem details if any
    let details = "";
    try {
      const text = await res.text();
      details = text?.trim();
    } catch {
      /* ignore */
    }
    return rejectWithValue(
      `Delete failed (${res.status}). ${details || "Internal Server Error."}`
    );
  } catch (err: any) {
    return rejectWithValue(err?.message || "Network error.");
  }
});

const nameMasterDeleteSlice = createSlice({
  name: "nameMasterDelete",
  initialState,
  reducers: {
    resetDeleteState: (state) => {
      state.loading = false;
      state.error = null;
      state.lastDeletedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteNameMasterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteNameMasterById.fulfilled,
        (state, action: PayloadAction<{ id: number }>) => {
          state.loading = false;
          state.lastDeletedId = action.payload.id;
        }
      )
      .addCase(deleteNameMasterById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Delete failed.";
      });
  },
});

export const { resetDeleteState } = nameMasterDeleteSlice.actions;
export default nameMasterDeleteSlice.reducer;

// Selectors
export const selectNameMasterDeleteLoading = (s: any) =>
  (s.nameMasterDelete as DeleteState).loading;
export const selectNameMasterDeleteError = (s: any) =>
  (s.nameMasterDelete as DeleteState).error;
export const selectLastDeletedNameMasterId = (s: any) =>
  (s.nameMasterDelete as DeleteState).lastDeletedId;
