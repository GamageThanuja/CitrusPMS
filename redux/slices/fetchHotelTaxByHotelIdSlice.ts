// redux/slices/fetchHotelTaxByHotelIdSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface HotelTax {
  hotelTaxId: number;
  hotelId: number;
  hotelCode: string;
  serviceCharge: number;
  tdl: number;
  sscl: number;
  vat: number;
}

interface FetchHotelTaxByHotelIdState {
  loading: boolean;
  error: string | null;
  data: HotelTax[];
}

const initialState: FetchHotelTaxByHotelIdState = {
  loading: false,
  error: null,
  data: [],
};

export interface FetchHotelTaxByHotelIdParams {
  hotelId: number | string; // path param
  hotelCode?: string;       // query
  userId?: number;          // query
  userRole?: string;        // query
}

/** ---- Thunk: GET /api/HotelTax/by-hotel/{hotelId} ---- */
export const fetchHotelTaxByHotelId = createAsyncThunk<
  HotelTax[],
  FetchHotelTaxByHotelIdParams,
  { rejectValue: string }
>(
  "hotelTaxByHotelId/fetch",
  async ({ hotelId, hotelCode, userId, userRole }, { rejectWithValue }) => {
    try {
      const response = await axios.get<HotelTax[]>(
        `${API_BASE_URL}/api/HotelTax/by-hotel/${hotelId}`,
        {
          params: {
            hotelCode,
            userId,
            userRole,
          },
        }
      );
      return response.data || [];
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch hotel tax by hotel.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const fetchHotelTaxByHotelIdSlice = createSlice({
  name: "fetchHotelTaxByHotelId",
  initialState,
  reducers: {
    clearHotelTaxByHotelId(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelTaxByHotelId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchHotelTaxByHotelId.fulfilled,
        (state, action: PayloadAction<HotelTax[]>) => {
          state.loading = false;
          state.data = action.payload || [];
        }
      )
      .addCase(fetchHotelTaxByHotelId.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch hotel tax by hotel.";
      });
  },
});

/** ---- Exports ---- */
export const { clearHotelTaxByHotelId } = fetchHotelTaxByHotelIdSlice.actions;
export default fetchHotelTaxByHotelIdSlice.reducer;

/** ---- Selectors ---- */
export const selectHotelTaxByHotelIdLoading = (state: any) =>
  state.fetchHotelTaxByHotelId?.loading ?? false;

export const selectHotelTaxByHotelIdError = (state: any) =>
  state.fetchHotelTaxByHotelId?.error ?? null;

export const selectHotelTaxByHotelIdData = (state: any) =>
  (state.fetchHotelTaxByHotelId?.data as HotelTax[]) ?? [];