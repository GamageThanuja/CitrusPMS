import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelTax {
  hotelTaxId: number;
  hotelId: number;
  serviceCharge: number;
  tdl: number;
  sscl: number;
  vat: number;
}

interface UpdateHotelTaxPayload {
  id: number;
  serviceCharge: number;
  tdl: number;
  sscl: number;
  vat: number;
}

interface UpdateHotelTaxState {
  data: HotelTax | null;
  loading: boolean;
  error: string | null;
}

const initialState: UpdateHotelTaxState = {
  data: null,
  loading: false,
  error: null,
};

// Async thunk for PUT /api/HotelTax/{id}
export const updateHotelTax = createAsyncThunk<
  HotelTax,
  UpdateHotelTaxPayload,
  { rejectValue: string }
>("hotelTaxUpdate/update", async ({ id, ...body }, { rejectWithValue }) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens.accessToken;

    console.log("🔁 PUT /api/HotelTax/", id, body); // <-- Add this

    const response = await axios.put(`${BASE_URL}/api/HotelTax/${id}`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data as HotelTax;
  } catch (err: any) {
    console.error("❌ Error:", err?.response?.data || err.message); // <-- Add this
    const message =
      err.response?.data?.detail || err.message || "Failed to update hotel tax";
    return rejectWithValue(message);
  }
});

const updateHotelTaxSlice = createSlice({
  name: "updateHotelTax",
  initialState,
  reducers: {
    resetUpdateHotelTaxState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelTax.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHotelTax.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateHotelTax.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Update failed";
      });
  },
});

export const { resetUpdateHotelTaxState } = updateHotelTaxSlice.actions;
export default updateHotelTaxSlice.reducer;
