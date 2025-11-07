import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface GuestProfileRemark {
  recordId: number;
  guestProfileId: number;
  finAct: boolean;
  remarks: string;
  createdOn: string;
  createdBy: string;
}

interface GuestProfileRemarkState {
  loading: boolean;
  error: string | null;
  data: GuestProfileRemark[]; // It's an array response
}

const initialState: GuestProfileRemarkState = {
  loading: false,
  error: null,
  data: [],
};

// Async thunk
export const fetchGuestProfileRemarks = createAsyncThunk<
  GuestProfileRemark[],
  number
>("guestProfileRemark/fetch", async (guestProfileId, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const response = await axios.get(
      `${BASE_URL}/api/GuestProfileRemark/guestProfile/${guestProfileId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch guest profile remarks"
    );
  }
});

// Slice
const fetchuGestProfileRemarkSlice = createSlice({
  name: "guestProfileRemark",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestProfileRemarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuestProfileRemarks.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGuestProfileRemarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default fetchuGestProfileRemarkSlice.reducer;
