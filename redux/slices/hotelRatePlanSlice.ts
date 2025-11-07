// src/store/slices/hotelRatePlanSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
interface HotelRatePlanPayload {
  recordID: number;
  hotelRatePlanID: number;
  rateDate: string;
  defaultRate: number;
  pax1: number;
  pax2: number;
  pax3: number;
  pax4: number;
  pax5: number;
  pax6: number;
  pax7: number;
  pax8: number;
  pax9: number;
  pax10: number;
  pax11: number;
  pax12: number;
  pax13: number;
  pax14: number;
  pax15: number;
  pax16: number;
  pax17: number;
  pax18: number;
  child: number;
  dateFrom: string;
  dateTo: string;
  sellMode: string;
  rateMode: string;
  roomTypeID: number;
  primaryOccupancy: number;
  increaseBy: number;
  decreaseBy: number;
  hotelID: number;
  rateCodeID: number;
  title: string;
  mealPlanID: number;
  currencyCode: string;
  childRate: number;
  createdOn: string;
  createdBy: string;
  cmid: string;
  hotelRates: any[];
}

interface HotelRatePlanState {
  loading: boolean;
  success: boolean;
  error: string | null;
  createdData: any | null;
}

const initialState: HotelRatePlanState = {
  loading: false,
  success: false,
  error: null,
  createdData: null,
};

// Thunk for creating hotel rate plan
export const createHotelRatePlan = createAsyncThunk(
  "hotelRatePlans/create",
  async (payload: HotelRatePlanPayload, { rejectWithValue }) => {
    try {
      // Get token
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // Get hotel ID from selectedProperty
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!accessToken) {
        return rejectWithValue("No access token found");
      }
      if (!hotelId) {
        return rejectWithValue("No hotel ID found in selectedProperty");
      }

      // Ensure hotelId is assigned in payload
      const dataToSend = {
        ...payload,
        hotelID: hotelId,
      };

      const res = await axios.post(
        `${BASE_URL}/api/HotelRatePlans`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const hotelRatePlanSlice = createSlice({
  name: "hotelRatePlans",
  initialState,
  reducers: {
    resetHotelRatePlanState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.createdData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelRatePlan.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createHotelRatePlan.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.createdData = action.payload;
      })
      .addCase(createHotelRatePlan.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetHotelRatePlanState } = hotelRatePlanSlice.actions;
export default hotelRatePlanSlice.reducer;
