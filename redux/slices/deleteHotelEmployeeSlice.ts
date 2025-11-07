// src/redux/slices/deleteHotelEmployeeSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DeleteHotelEmployeeState {
  success: boolean | null; // true if deleted, false if API returned false, null before call
  loading: boolean;
  error: string | null;
}

const initialState: DeleteHotelEmployeeState = {
  success: null,
  loading: false,
  error: null,
};

export const deleteHotelEmployee = createAsyncThunk<boolean, number>(
  "hotelEmployee/delete",
  async (id, thunkAPI) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken: string | undefined = parsed?.accessToken;

      if (!accessToken) throw new Error("Missing access token");

      const res = await axios.delete(`${BASE_URL}/api/HotelEmployee/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
        },
        // Some backends send `true` as text/plain
        transformResponse: [(d) => d],
        validateStatus: (s) => s >= 200 && s < 300,
      });

      const raw = res.data as unknown;
      // Accept: boolean true, or string "true"/"false"
      if (typeof raw === "boolean") return raw;
      if (typeof raw === "string") {
        const trimmed = raw.trim().toLowerCase();
        if (trimmed === "true") return true;
        if (trimmed === "false") return false;
        // If server returned JSON string like "true" with quotes or something else:
        try {
          const parsedBool = JSON.parse(raw);
          return !!parsedBool;
        } catch {
          // fallback: treat non-empty string as success? safer to throw
          throw new Error("Unexpected delete response format");
        }
      }
      // If server returned {} or null, assume success (200 OK) -> true
      return true;
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.title ||
        error?.message ||
        "Failed to delete employee";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const deleteHotelEmployeeSlice = createSlice({
  name: "deleteHotelEmployee",
  initialState,
  reducers: {
    resetDeleteHotelEmployeeState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHotelEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteHotelEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload ?? true;
      })
      .addCase(deleteHotelEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to delete employee";
        state.success = false;
      });
  },
});

export const { resetDeleteHotelEmployeeState } =
  deleteHotelEmployeeSlice.actions;
export default deleteHotelEmployeeSlice.reducer;
