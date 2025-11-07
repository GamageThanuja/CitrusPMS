import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelPosCenter {
  hotelPosCenterId: number;
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy: string;
  createdOn: string;
}

interface HotelPosCenterState {
  data: HotelPosCenter[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelPosCenterState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchHotelPosCenters = createAsyncThunk<
  HotelPosCenter[],
  void,
  { rejectValue: string }
>("hotelPosCenter/fetch", async (_, thunkAPI) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    const accessToken = tokens.accessToken;
    const hotelId = property.id;

    const response = await axios.get(
      `${BASE_URL}/api/HotelPosCenter/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.message || "Failed to fetch POS centers"
    );
  }
});

const hotelPosCenterSlice = createSlice({
  name: "hotelPosCenter",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelPosCenters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchHotelPosCenters.fulfilled,
        (state, action: PayloadAction<HotelPosCenter[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchHotelPosCenters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error";
      });
  },
});

export default hotelPosCenterSlice.reducer;

// redux/slices/hotelPosCenterSlice.ts
export const selectHotelPosCenters = (state: any) => state.hotelPosCenter.data;
export const selectHotelPosCentersLoading = (state: any) =>
  state.hotelPosCenter.loading;
export const selectHotelPosCentersError = (state: any) =>
  state.hotelPosCenter.error;
