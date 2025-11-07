import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ReservationRemarkPayload {
  finAct: boolean;
  reservationId: number;
  reservationDetailId: number;
  remarks: string;
  createdBy: string;
}

interface ReservationRemarkResponse {
  recordId: number;
  finAct: boolean;
  reservationId: number;
  reservationDetailId: number;
  remarks: string;
  createdBy: string;
  createdOn: string;
}

interface ReservationRemarkState {
  loading: boolean;
  error: string | null;
  data: ReservationRemarkResponse | null;
}

const initialState: ReservationRemarkState = {
  loading: false,
  error: null,
  data: null,
};

// Async thunk
export const postReservationRemark = createAsyncThunk<
  ReservationRemarkResponse,
  ReservationRemarkPayload
>("reservationRemark/post", async (payload, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsed?.accessToken;

    const response = await axios.post(
      `${BASE_URL}/api/ReservationRemark`,
      payload,
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
      error.response?.data?.detail || "Failed to post reservation remark"
    );
  }
});

const reservationRemarkSlice = createSlice({
  name: "reservationRemark",
  initialState,
  reducers: {
    resetReservationRemark: (state) => {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postReservationRemark.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postReservationRemark.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(postReservationRemark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetReservationRemark } = reservationRemarkSlice.actions;
export default reservationRemarkSlice.reducer;
