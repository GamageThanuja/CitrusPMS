// src/redux/slices/deleteItemMasterSlice.ts
"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface DeleteState {
  status: Status;
  error: string | null;
  lastDeletedId: number | null; // itemID that was deleted
}

const initialState: DeleteState = {
  status: "idle",
  error: null,
  lastDeletedId: null,
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Delete an ItemMaster by its REAL PK: itemID (number).
 * Returns the same id on success so callers can react.
 */
export const deleteItemMaster = createAsyncThunk<
  number, // return value
  number, // arg: itemID
  { rejectValue: string }
>("itemMaster/delete", async (id, thunkAPI) => {
  try {
    const tokenRaw = localStorage.getItem("hotelmateTokens");
    const tokens = tokenRaw ? JSON.parse(tokenRaw) : null;
    const accessToken: string | undefined = tokens?.accessToken;

    if (!accessToken) {
      return thunkAPI.rejectWithValue("No access token in localStorage.");
    }

    const res = await axios.delete(`${API_BASE}/api/ItemMaster/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/plain, application/json",
      },
      // NOTE: API returns 204 No Content on success
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (res.status === 204) {
      return id; // success
    }
    if (res.status === 404) {
      return thunkAPI.rejectWithValue("Item not found (404).");
    }

    // 4xx/5xx with body
    const message =
      (res.data?.detail as string) ||
      (res.data?.title as string) ||
      `Delete failed with status ${res.status}.`;
    return thunkAPI.rejectWithValue(message);
  } catch (err: any) {
    const msg = err?.message || "Failed to delete item.";
    return thunkAPI.rejectWithValue(msg);
  }
});

const deleteItemMasterSlice = createSlice({
  name: "deleteItemMaster",
  initialState,
  reducers: {
    resetDeleteState(state) {
      state.status = "idle";
      state.error = null;
      state.lastDeletedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteItemMaster.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.lastDeletedId = null;
      })
      .addCase(
        deleteItemMaster.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.status = "succeeded";
          state.lastDeletedId = action.payload;
        }
      )
      .addCase(deleteItemMaster.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Delete failed.";
      });
  },
});

export const { resetDeleteState } = deleteItemMasterSlice.actions;
export default deleteItemMasterSlice.reducer;

// Selectors
export const selectDeleteStatus = (s: RootState) => s.deleteItemMaster.status;
export const selectDeleteError = (s: RootState) => s.deleteItemMaster.error;
export const selectLastDeletedId = (s: RootState) =>
  s.deleteItemMaster.lastDeletedId;
