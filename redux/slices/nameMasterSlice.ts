import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk to fetch NameMaster data
export const fetchNameMasterByHotel = createAsyncThunk(
  "nameMaster/fetchByHotel",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!hotelId) {
        return rejectWithValue("Hotel ID not found in localStorage");
      }

      const response = await axios.get(
        `${BASE_URL}/api/NameMaster/hotel/${hotelId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Unknown error"
      );
    }
  }
);

const nameMasterSlice = createSlice({
  name: "nameMaster",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetNameMasterState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNameMasterByHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNameMasterByHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchNameMasterByHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetNameMasterState } = nameMasterSlice.actions;
export default nameMasterSlice.reducer;
