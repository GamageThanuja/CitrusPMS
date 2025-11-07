import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 🧩 Types for nested objects
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

interface HotelMaster {
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
  hotelDesc: string;
  isCMActive: boolean;
  hotelDate: string;
  isOnTrial: boolean;
  planId: number;
  hotelImage: HotelImage;
  lowestRate: number;
}

interface HotelRoomType {
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

// 🧩 Final payload type
export interface HotelRoomNumberPayload {
  roomID: number;
  hotelID: number;
  hotelMaster: HotelMaster;
  roomTypeID: number;
  hotelRoomType: HotelRoomType;
  roomNo: string;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
}

// 🧩 Slice state
interface UpdateHotelRoomNumberState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: UpdateHotelRoomNumberState = {
  loading: false,
  error: null,
  success: false,
};

// 🚀 Thunk for PUT call
// updateHotelRoomNumberSlice.ts (example with axios + RTK)
export const updateHotelRoomNumber = createAsyncThunk(
  "roomNumbers/update",
  async (
    { id, payload, token }: { id: number; payload: any; token: string },
    { rejectWithValue }
  ) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;
      const res = await axios.put(
        `${BASE_URL}/api/HotelRoomNumber/${id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue({
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
    }
  }
);

// 🧩 Slice
const updateHotelRoomNumberSlice = createSlice({
  name: "updateHotelRoomNumber",
  initialState,
  reducers: {
    resetUpdateStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelRoomNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateHotelRoomNumber.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateHotelRoomNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { resetUpdateStatus } = updateHotelRoomNumberSlice.actions;
export default updateHotelRoomNumberSlice.reducer;
