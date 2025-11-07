// redux/slices/performanceByAgentSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Thunk to fetch performance by agent
export const fetchPerformanceByAgent = createAsyncThunk(
  "performanceByAgent/fetchPerformanceByAgent",
  async (
    { startDate, endDate }: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      // === Get token ===
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // === Get selected hotel ===
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!hotelId) {
        return rejectWithValue("Hotel ID not found in localStorage");
      }

      const response = await axios.get(
        `${BASE_URL}/api/Dashboard/performance-by-agent`,
        {
          params: { hotelId, startDate, endDate },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice
const performanceByAgentSlice = createSlice({
  name: "performanceByAgent",
  initialState: {
    data: [] as any[],
    status: "idle", // idle | loading | succeeded | failed
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPerformanceByAgent.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPerformanceByAgent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchPerformanceByAgent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default performanceByAgentSlice.reducer;

// Selector
export const selectPerformanceByAgent = (state: RootState) =>
  state.performanceByAgent;
