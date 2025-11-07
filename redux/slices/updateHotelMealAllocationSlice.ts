import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Reuse the server response type used in your POST slice (or define here)
export interface HotelMealAllocation {
  id: number;
  hotelId: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  currencyCode: string;
  ai: number;
  createdBy?: string | null;
  createdOn?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedOn?: string | null;
}

// PUT body DTO
export interface UpdateHotelMealAllocationDTO {
  id: number; // path param
  breakfast: number;
  lunch: number;
  dinner: number;
  currencyCode: string;
  ai: number;
}

interface UpdateMealAllocationState {
  data: HotelMealAllocation | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UpdateMealAllocationState = {
  data: null,
  status: "idle",
  error: null,
};

export const updateHotelMealAllocation = createAsyncThunk<
  HotelMealAllocation,
  UpdateHotelMealAllocationDTO
>("hotelMealAllocation/update", async (payload, { rejectWithValue }) => {
  try {
    // 🔑 Token
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    if (!payload?.id) {
      return rejectWithValue("Meal allocation ID is required.");
    }

    const body = {
      breakfast: Number(payload.breakfast ?? 0),
      lunch: Number(payload.lunch ?? 0),
      dinner: Number(payload.dinner ?? 0),
      currencyCode: payload.currencyCode,
      ai: Number(payload.ai ?? 0),
    };

    const res = await axios.put(
      `${BASE_URL}/api/HotelMealAllocation/${payload.id}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        validateStatus: (s) => s >= 200 && s < 400, // treat 2xx/3xx as success
      }
    );

    return res.data as HotelMealAllocation;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.message ||
      "Unknown error";
    return rejectWithValue(msg);
  }
});

const updateHotelMealAllocationSlice = createSlice({
  name: "updateHotelMealAllocation",
  initialState,
  reducers: {
    resetUpdateHotelMealAllocationState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelMealAllocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateHotelMealAllocation.fulfilled,
        (state, action: PayloadAction<HotelMealAllocation>) => {
          state.status = "succeeded";
          state.data = action.payload;
        }
      )
      .addCase(updateHotelMealAllocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Request failed";
      });
  },
});

export const { resetUpdateHotelMealAllocationState } =
  updateHotelMealAllocationSlice.actions;

export const selectUpdateHotelMealAllocation = (state: RootState) =>
  state.updateHotelMealAllocation;

export default updateHotelMealAllocationSlice.reducer;
