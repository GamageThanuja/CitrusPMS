import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelIPG {
  ipgId?: number;
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

interface HotelIPGState {
  data: HotelIPG | null;
  loading: boolean;
  error: string | null;
}

const initialState: HotelIPGState = {
  data: null,
  loading: false,
  error: null,
};

// Async thunk
export const createHotelIPG = createAsyncThunk<
  HotelIPG,
  Omit<
    HotelIPG,
    "ipgId" | "createdOn" | "createdBy" | "updatedOn" | "updatedBy"
  >,
  { rejectValue: string }
>("hotelIPG/createHotelIPG", async (payload, { rejectWithValue }) => {
  try {
    // Tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // Hotel
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!accessToken) {
      return rejectWithValue("Unauthorized: Missing access token");
    }
    if (!hotelId) {
      return rejectWithValue("Bad Request: Hotel ID not found");
    }

    const response = await axios.post(
      `${BASE_URL}/api/HotelIPG`,
      { ...payload, hotelId }, // always attach hotelId
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return response.data as HotelIPG;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Something went wrong"
    );
  }
});

const createHotelIPGSlice = createSlice({
  name: "hotelIPG",
  initialState,
  reducers: {
    resetHotelIPGState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelIPG.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createHotelIPG.fulfilled,
        (state, action: PayloadAction<HotelIPG>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(createHotelIPG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create Hotel IPG";
      });
  },
});

export const { resetHotelIPGState } = createHotelIPGSlice.actions;
export default createHotelIPGSlice.reducer;
