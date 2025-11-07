// src/redux/slices/currencyExchangeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ExchangeRateState {
  rate: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExchangeRateState = {
  rate: null,
  loading: false,
  error: null,
};

// Async thunk
export const fetchExchangeRate = createAsyncThunk<
  number,
  { baseCurrency: string; targetCurrency: string }
>(
  "currencyExchange/fetchExchangeRate",
  async ({ baseCurrency, targetCurrency }, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.get(
        `${BASE_URL}/api/Currency/exchange-rate`,
        {
          params: { baseCurrency, targetCurrency },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Hotel-Id": hotelId, // only if your API expects hotelId header
          },
        }
      );

      // API returns text/plain, so response.data is string
      return parseFloat(response.data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

const currencyExchangeSlice = createSlice({
  name: "currencyExchange",
  initialState,
  reducers: {
    clearExchangeRate: (state) => {
      state.rate = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchExchangeRate.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.loading = false;
          state.rate = action.payload;
        }
      )
      .addCase(fetchExchangeRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearExchangeRate } = currencyExchangeSlice.actions;
export default currencyExchangeSlice.reducer;
