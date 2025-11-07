import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DeleteMealAllocationState {
  deletedId: number | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DeleteMealAllocationState = {
  deletedId: null,
  status: "idle",
  error: null,
};

export const deleteHotelMealAllocation = createAsyncThunk<number, number>(
  "hotelMealAllocation/delete",
  async (id, { rejectWithValue }) => {
    try {
      if (!id && id !== 0) return rejectWithValue("ID is required.");

      // 🔑 Token
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const res = await axios.delete(
        `${BASE_URL}/api/HotelMealAllocation/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          validateStatus: (s) => s >= 200 && s < 500, // let us parse 404 messages too
        }
      );

      if (res.status === 204) {
        return id; // success — return id for reducers/optimistic updates
      }

      // Handle common errors explicitly
      const msg =
        res.data?.detail ||
        res.data?.title ||
        (res.status === 404
          ? "Meal allocation not found."
          : res.status === 401
          ? "Unauthorized."
          : "Delete failed.");
      return rejectWithValue(msg);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        "Unknown error";
      return rejectWithValue(msg);
    }
  }
);

const deleteHotelMealAllocationSlice = createSlice({
  name: "deleteHotelMealAllocation",
  initialState,
  reducers: {
    resetDeleteHotelMealAllocationState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHotelMealAllocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.deletedId = null;
      })
      .addCase(
        deleteHotelMealAllocation.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.status = "succeeded";
          state.deletedId = action.payload;
        }
      )
      .addCase(deleteHotelMealAllocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Request failed";
      });
  },
});

export const { resetDeleteHotelMealAllocationState } =
  deleteHotelMealAllocationSlice.actions;

export const selectDeleteHotelMealAllocation = (state: RootState) =>
  state.deleteHotelMealAllocation;

export default deleteHotelMealAllocationSlice.reducer;
