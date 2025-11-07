// redux/slices/fetchHotelByGuidSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Hotel {
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
  lastUpdatedOn: string | null;
  lastUpdatedTimeStamp: string | null;
  lastUpdatedBy_UserGUID: string;
  starCatgeory: number;
  cM_PropertyID: string;
  hotelDesc: string;
  isCMActive: boolean;
  isIBEActive: boolean;
  ibE_CancellationPolicy: string;
  ibE_ChildPolicy: string;
  ibE_TaxPolicy: string;
  logoURL: string;
  slug: string | null;
  hotelDate: string;
  isOnTrial: boolean | null;
  planId: number | null;
  lowestRate: number | null;
}

interface FetchHotelState {
  data: Hotel | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: FetchHotelState = {
  data: null,
  status: "idle",
  error: null,
};

// Thunk to fetch hotel by guid
export const fetchHotelByGuid = createAsyncThunk<
  Hotel,
  void,
  { rejectValue: string }
>("hotel/fetchByGuid", async (_, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : null;
    const guid = property?.guid;

    if (!guid) {
      return rejectWithValue("No hotel GUID found in selectedProperty");
    }

    const res = await fetch(`${BASE_URL}/api/Hotel/hotel-guid/${guid}`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed with status ${res.status}`);
    }

    const data: Hotel[] = await res.json();
    return data[0]; // API returns an array
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

const fetchHotelByGuidSlice = createSlice({
  name: "hotelByGuid",
  initialState,
  reducers: {
    resetHotelByGuidState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelByGuid.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHotelByGuid.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchHotelByGuid.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch hotel by guid";
      });
  },
});

export const { resetHotelByGuidState } = fetchHotelByGuidSlice.actions;
export const selectHotelByGuid = (state: RootState) => state.hotelByGuid;
export default fetchHotelByGuidSlice.reducer;
