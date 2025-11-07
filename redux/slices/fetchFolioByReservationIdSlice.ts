import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunk for fetching folio transactions by reservationId
export const fetchFolioByReservationId = createAsyncThunk(
  "folio/fetchFolioByReservationId",
  async (reservationId: number, { rejectWithValue }) => {
    try {
      const tokens = localStorage.getItem("hotelmateTokens");
      const accessToken = tokens ? JSON.parse(tokens).accessToken : null;
      const response = await axios.get(
        `${BASE_URL}/api/Reservation/Reservation/${reservationId}/Folio`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch folio transactions"
      );
    }
  }
);

interface FetchFolioByReservationIdState {
  data: any[];
  loading: boolean;
  error: null | string;
}

const initialState: FetchFolioByReservationIdState = {
  data: [],
  loading: false,
  error: null,
};

const fetchFolioByReservationIdSlice = createSlice({
  name: "fetchFolioByReservationId",
  initialState,
  reducers: {
    resetFetchFolioByReservationIdState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolioByReservationId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolioByReservationId.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchFolioByReservationId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetFetchFolioByReservationIdState } =
  fetchFolioByReservationIdSlice.actions;
export default fetchFolioByReservationIdSlice.reducer;
