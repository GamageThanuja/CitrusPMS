// @ts-nocheck
"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  HotelEmployeeCreate,
  HotelEmployeeResponse,
} from "@/types/hotelEmployee";
import { createHotelEmployee } from "@/controllers/hotelEmployeeController";

export interface HotelEmployeeCreateState {
  loading: boolean;
  error: string | null;
  data: HotelEmployeeResponse | null;
}

const initialState: HotelEmployeeCreateState = {
  loading: false,
  error: null,
  data: null,
};

export const postHotelEmployee = createAsyncThunk<
  HotelEmployeeResponse,
  HotelEmployeeCreate
>("hotelEmployee/post", async (payload, { rejectWithValue }) => {
  try {
    const res = await createHotelEmployee(payload);
    return res;
  } catch (err: any) {
    // normalize error message
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.message ||
      "Failed to create employee";
    return rejectWithValue(message);
  }
});

const hotelEmployeeCreateSlice = createSlice({
  name: "hotelEmployeeCreate",
  initialState,
  reducers: {
    resetHotelEmployeeCreate(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postHotelEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(
        postHotelEmployee.fulfilled,
        (state, action: PayloadAction<HotelEmployeeResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(postHotelEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to create employee";
      });
  },
});

export const { resetHotelEmployeeCreate } = hotelEmployeeCreateSlice.actions;
export default hotelEmployeeCreateSlice.reducer;
