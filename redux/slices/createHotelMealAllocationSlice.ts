import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface CreateHotelMealAllocationDTO {
  hotelId?: number; // optional — will fall back to localStorage
  breakfast: number;
  lunch: number;
  dinner: number;
  currencyCode: string;
  ai: number;
}

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

interface CreateMealAllocationState {
  data: HotelMealAllocation | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CreateMealAllocationState = {
  data: null,
  status: "idle",
  error: null,
};

export const createHotelMealAllocation = createAsyncThunk<
  HotelMealAllocation,
  CreateHotelMealAllocationDTO
>("hotelMealAllocation/create", async (payload, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    let hotelId = payload.hotelId;
    if (!hotelId) {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      hotelId = property.id;
    }
    if (!hotelId) {
      return rejectWithValue("Hotel ID not found (payload/localStorage).");
    }

    const body = {
      hotelId,
      breakfast: Number(payload.breakfast ?? 0),
      lunch: Number(payload.lunch ?? 0),
      dinner: Number(payload.dinner ?? 0),
      currencyCode: payload.currencyCode,
      ai: Number(payload.ai ?? 0),
    };

    const res = await axios.post(`${BASE_URL}/api/HotelMealAllocation`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      // validateStatus allows us to treat 201 as success explicitly
      validateStatus: (s) => s >= 200 && s < 400,
    });

    // Backend returns 201 Created with the new record
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

const createHotelMealAllocationSlice = createSlice({
  name: "createHotelMealAllocation",
  initialState,
  reducers: {
    resetCreateHotelMealAllocationState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelMealAllocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        createHotelMealAllocation.fulfilled,
        (state, action: PayloadAction<HotelMealAllocation>) => {
          state.status = "succeeded";
          state.data = action.payload;
        }
      )
      .addCase(createHotelMealAllocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Request failed";
      });
  },
});

export const { resetCreateHotelMealAllocationState } =
  createHotelMealAllocationSlice.actions;

export const selectCreateHotelMealAllocation = (state: RootState) =>
  state.createHotelMealAllocation;

export default createHotelMealAllocationSlice.reducer;
