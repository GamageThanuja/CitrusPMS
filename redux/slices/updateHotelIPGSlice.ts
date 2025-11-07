// src/redux/slices/updateHotelIPGSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelIPG {
  ipgId: number;
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

interface UpdateState {
  data: HotelIPG | null;
  loading: boolean;
  error: string | null;
}

const initialState: UpdateState = {
  data: null,
  loading: false,
  error: null,
};

// DTO for update (no ipgId/hotelId required in body)
type UpdateIPGDto = {
  isIPGActive: boolean;
  bankName: string;
  country: string;
  ipgName: string;
  merchandIdUSD: string;
  profileIdUSD: string;
  accessKeyUSD: string;
  secretKey: string;
};

export const updateHotelIPG = createAsyncThunk<
  HotelIPG,
  { id: number; payload: UpdateIPGDto },
  { rejectValue: string }
>("hotelIPG/updateHotelIPG", async ({ id, payload }, { rejectWithValue }) => {
  try {
    // Token
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;
    if (!accessToken)
      return rejectWithValue("Unauthorized: Missing access token");

    const url = `${BASE_URL}/api/HotelIPG/${id}`;
    const { data } = await axios.put<HotelIPG>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update Hotel IPG"
    );
  }
});

const updateHotelIPGSlice = createSlice({
  name: "updateHotelIPG",
  initialState,
  reducers: {
    resetUpdateHotelIPGState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelIPG.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateHotelIPG.fulfilled,
        (state, action: PayloadAction<HotelIPG>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateHotelIPG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update Hotel IPG";
      });
  },
});

export const { resetUpdateHotelIPGState } = updateHotelIPGSlice.actions;
export default updateHotelIPGSlice.reducer;
