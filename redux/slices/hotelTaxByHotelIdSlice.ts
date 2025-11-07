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

interface HotelTaxByHotelIdState {
  data: HotelTax[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelTaxByHotelIdState = {
  data: [],
  loading: false,
  error: null,
};

// 🔄 Thunk to GET HotelTax by hotel ID
export const fetchHotelTaxByHotelId = createAsyncThunk<
  HotelTax[],
  number,
  { rejectValue: string }
>("hotelTaxByHotelId/fetch", async (hotelId, { rejectWithValue }) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens.accessToken;

    const response = await axios.get(
      `${BASE_URL}/api/HotelTax/by-hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data as HotelTax[];
  } catch (err: any) {
    const message =
      err.response?.data?.detail || err.message || "Failed to fetch hotel tax";
    return rejectWithValue(message);
  }
});

const hotelTaxByHotelIdSlice = createSlice({
  name: "hotelTaxByHotelId",
  initialState,
  reducers: {
    resetHotelTaxByHotelIdState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelTaxByHotelId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelTaxByHotelId.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchHotelTaxByHotelId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { resetHotelTaxByHotelIdState } = hotelTaxByHotelIdSlice.actions;
export default hotelTaxByHotelIdSlice.reducer;
