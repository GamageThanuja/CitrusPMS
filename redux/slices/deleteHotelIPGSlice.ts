// src/redux/slices/deleteHotelIPGSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DeleteState {
  lastDeletedId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: DeleteState = {
  lastDeletedId: null,
  loading: false,
  error: null,
};

export const deleteHotelIPG = createAsyncThunk<
  { id: number }, // return just the id we deleted
  { id: number }, // arg requires the id
  { rejectValue: string }
>("hotelIPG/deleteHotelIPG", async ({ id }, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    if (!accessToken)
      return rejectWithValue("Unauthorized: Missing access token");

    const url = `${BASE_URL}/api/HotelIPG/${id}`;
    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    // API returns 204 No Content on success; we just echo back the id
    return { id };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete IPG configuration"
    );
  }
});

const deleteHotelIPGSlice = createSlice({
  name: "deleteHotelIPG",
  initialState,
  reducers: {
    resetDeleteHotelIPGState: (state) => {
      state.lastDeletedId = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHotelIPG.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteHotelIPG.fulfilled,
        (state, action: PayloadAction<{ id: number }>) => {
          state.loading = false;
          state.lastDeletedId = action.payload.id;
        }
      )
      .addCase(deleteHotelIPG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete IPG configuration";
      });
  },
});

export const { resetDeleteHotelIPGState } = deleteHotelIPGSlice.actions;
export default deleteHotelIPGSlice.reducer;
