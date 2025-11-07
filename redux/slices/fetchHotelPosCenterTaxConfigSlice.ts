// redux/slices/fetchHotelPosCenterTaxConfigSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelPosCenterTaxConfig {
  recordId: number;
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
}

interface HotelPosCenterTaxConfigState {
  data: HotelPosCenterTaxConfig[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: HotelPosCenterTaxConfigState = {
  data: [],
  status: "idle",
  error: null,
};

// Thunk to fetch by posCenterId
export const fetchHotelPosCenterTaxConfig = createAsyncThunk<
  HotelPosCenterTaxConfig[],
  number,
  { rejectValue: string }
>(
  "hotelPosCenterTaxConfig/fetchByPosCenterId",
  async (posCenterId, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      if (!accessToken) throw new Error("Access token not found");

      const response = await fetch(
        `${BASE_URL}/api/HotelPOSCenterTaxConfig/pos-center/${posCenterId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      return data as HotelPosCenterTaxConfig[];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const fetchHotelPosCenterTaxConfigSlice = createSlice({
  name: "hotelPosCenterTaxConfig",
  initialState,
  reducers: {
    resetHotelPosCenterTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelPosCenterTaxConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHotelPosCenterTaxConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchHotelPosCenterTaxConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch tax config";
      });
  },
});

export const { resetHotelPosCenterTaxConfigState } =
  fetchHotelPosCenterTaxConfigSlice.actions;

export default fetchHotelPosCenterTaxConfigSlice.reducer;
