import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelIPG {
  ipgId: number;
  hotelId: number;
  isIPGActive: boolean;
  bankName: string;
  country: string;
  ipgName: string;
  merchandIdUSD: string;
  profileIdUSD: string;
  accessKeyUSD: string;
  secretKey: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

interface FetchState {
  data: HotelIPG[];
  loading: boolean;
  error: string | null;
  hotelId?: number; // the hotel this list belongs to (optional, for clarity)
}

const initialState: FetchState = {
  data: [],
  loading: false,
  error: null,
};

// Thunk: fetch IPG configs by hotel (hotelId optional → fallback to localStorage)
export const fetchHotelIPGsByHotel = createAsyncThunk<
  { hotelId: number; rows: HotelIPG[] },
  { hotelId?: number },
  { rejectValue: string }
>(
  "hotelIPG/fetchByHotelSimple",
  async ({ hotelId } = {}, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;
      if (!accessToken)
        return rejectWithValue("Unauthorized: Missing access token");

      let finalHotelId = hotelId;
      if (!finalHotelId) {
        const selectedProperty = localStorage.getItem("selectedProperty");
        const property = selectedProperty ? JSON.parse(selectedProperty) : {};
        finalHotelId = property?.id;
      }
      if (!finalHotelId)
        return rejectWithValue("Bad Request: Hotel ID not found");

      const url = `${BASE_URL}/api/HotelIPG/by-hotel/${finalHotelId}`;
      const { data } = await axios.get<HotelIPG[]>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      return { hotelId: finalHotelId, rows: data ?? [] };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch IPG configurations"
      );
    }
  }
);

const fetchHotelIPGSlice = createSlice({
  name: "hotelIPGList",
  initialState,
  reducers: {
    resetHotelIPGListState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
      state.hotelId = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelIPGsByHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelIPGsByHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.data = action.payload.rows;
        state.hotelId = action.payload.hotelId;
      })
      .addCase(fetchHotelIPGsByHotel.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch IPG configurations";
      });
  },
});

export const { resetHotelIPGListState } = fetchHotelIPGSlice.actions;
export default fetchHotelIPGSlice.reducer;
