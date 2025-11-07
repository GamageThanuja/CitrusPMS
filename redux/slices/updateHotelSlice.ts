import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string;
}

interface HotelPayload {
  hotelID: number;
  hotelGUID: string;
  finAct: boolean;
  hotelName: string;
  hotelCode: number;
  userGUID_HotelOwner: string;
  hotelType: string;
  hotelAddress: string;
  city: string;
  zipCode: string;
  country: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelWeb: string;
  noOfRooms: number;
  latitude: string;
  longitude: string;
  currencyCode: string;
  languageCode: string;
  createdOn: string;
  createdTimeStamp: string;
  lastUpdatedOn: string;
  lastUpdatedTimeStamp: string;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean;
  planId: number;
  lowestRate: number;
  hotelImage: HotelImage;
}

interface HotelState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: HotelState = {
  loading: false,
  error: null,
  success: false,
};

export const updateHotel = createAsyncThunk(
  "hotel/updateHotel",
  async (hotelData: HotelPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.put(
        `${BASE_URL}/api/Hotel/${hotelId}`,
        hotelData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update hotel"
      );
    }
  }
);

export const patchHotelGRCPara1 = createAsyncThunk(
  "hotel/patchHotelGRCPara1",
  async (payload: { grC_Para1: string }, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.patch(
        `${BASE_URL}/api/Hotel/${hotelId}`,
        { grC_Para1: payload?.grC_Para1 ?? "" },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to update Terms & Conditions"
      );
    }
  }
);

const updateHotelSlice = createSlice({
  name: "updateHotel",
  initialState,
  reducers: {
    resetUpdateHotelState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateHotel.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      .addCase(patchHotelGRCPara1.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(patchHotelGRCPara1.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(patchHotelGRCPara1.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetUpdateHotelState } = updateHotelSlice.actions;
export default updateHotelSlice.reducer;
