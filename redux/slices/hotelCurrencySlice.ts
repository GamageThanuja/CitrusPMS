import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelCurrency {
  id: number;
  hotelId: number;
  currencyId: number;
  exchangeRate: number;
}

interface HotelCurrencyState {
  data: HotelCurrency[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelCurrencyState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchHotelCurrencies = createAsyncThunk<HotelCurrency[], number>(
  "hotelCurrency/fetchHotelCurrencies",
  async (hotelId, thunkAPI) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.get(
        `${BASE_URL}/api/HotelCurrency/hotel/${hotelId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch");
    }
  }
);

const hotelCurrencySlice = createSlice({
  name: "hotelCurrency",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHotelCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default hotelCurrencySlice.reducer;
