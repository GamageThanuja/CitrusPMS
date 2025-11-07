// src/lib/features/rateDetails/rateDetailsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface RateDetail {
  recordId: number;
  hotelId: number;
  reservationId: number;
  reservationDetailId: number;
  rateDate: string;
  mealPlan: string;
  roomRate: number;
  discPercen: number;
  discount: number;
  childRate: number;
  exBedRate: number;
  suppliment: number;
  isFOC: boolean;
  netRate: number;
  currencyCode: string;
  exchangeRate: number;
  adult: number;
  child: number;
  isChecked: boolean;
  checkedBy: string;
  checkedAt: string;
  guestName: string;
  exBed: boolean;
  exBedCount: number;
  roomCount: number;
  isLocked: boolean;
  isNightAudit: boolean;
  updatedOn: string;
  updatedBy: string;
  finAct: boolean;
}

// Async thunk to fetch rate details by reservationDetailId
export const fetchRateDetailsById = createAsyncThunk(
  "rateDetails/fetchById",
  async (reservationDetailId: number, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.get<RateDetail[]>(
        `${BASE_URL}/api/Reservation/RateDetails/${reservationDetailId}`,
        {
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

interface RateDetailsState {
  data: RateDetail[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RateDetailsState = {
  data: [],
  isLoading: false,
  error: null,
};

const rateDetailsSlice = createSlice({
  name: "rateDetails",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRateDetailsById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchRateDetailsById.fulfilled,
        (state, action: PayloadAction<RateDetail[]>) => {
          state.isLoading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchRateDetailsById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default rateDetailsSlice.reducer;
