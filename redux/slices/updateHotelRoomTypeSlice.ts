import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface HotelRoomTypePayload {
  hotelRoomTypeID: number;
  hotelID: number;
  roomType: string;
  adultSpace: number;
  childSpace: number;
  noOfRooms: number;
  cmid: string;
  createdTimeStamp: string;
  createdBy: string;
  updatedBy: string;
  finAct: boolean;
  updatedTimeStamp: string;
  roomDescription: string;
}

interface UpdateState {
  data: HotelRoomTypePayload | null;
  loading: boolean;
  error: string | null;
}

const initialState: UpdateState = {
  data: null,
  loading: false,
  error: null,
};

export const updateHotelRoomType = createAsyncThunk(
  "hotelRoomType/update",
  async (payload: HotelRoomTypePayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      if (!accessToken) throw new Error("Access token is missing");

      const response = await axios.put(
        `${BASE_URL}/api/HotelRoomType/${payload.hotelRoomTypeID}`,
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
      return rejectWithValue(error.response?.data?.detail || "Update failed");
    }
  }
);

const updateHotelRoomTypeSlice = createSlice({
  name: "updateHotelRoomType",
  initialState,
  reducers: {
    clearUpdateHotelRoomTypeState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelRoomType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHotelRoomType.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateHotelRoomType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUpdateHotelRoomTypeState } =
  updateHotelRoomTypeSlice.actions;

export default updateHotelRoomTypeSlice.reducer;
