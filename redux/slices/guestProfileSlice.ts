import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface GuestProfile {
  id: number;
  guestName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  reservationDetailId: number;
  createdDate: string;
}

interface GuestProfileState {
  profile: GuestProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: GuestProfileState = {
  profile: null,
  loading: false,
  error: null,
};

// Async thunk
export const fetchGuestProfileByReservationDetail = createAsyncThunk<
  GuestProfile,
  number
>(
  "guestProfile/fetchByReservationDetail",
  async (reservationDetailId, thunkAPI) => {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;

      const response = await axios.get<GuestProfile>(
        `${BASE_URL}/api/GuestProfileByRoomMaster/by-reservation-detail/${reservationDetailId}`,
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || "Request failed");
    }
  }
);

const guestProfileSlice = createSlice({
  name: "guestProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestProfileByReservationDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchGuestProfileByReservationDetail.fulfilled,
        (state, action) => {
          state.loading = false;
          state.profile = action.payload;
        }
      )
      .addCase(
        fetchGuestProfileByReservationDetail.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export default guestProfileSlice.reducer;

// --- GuestProfileMaster slice for GET /api/GuestProfileMaster/{id} ---

// Define the type for the response
export interface GuestProfileMaster {
  profileId: number;
  hotelId: number;
  title: string;
  guestName: string;
  dob: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  nationality: string;
  ppNo: string;
  phone: string;
  email: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  recordId: number;
  finAct: boolean;
  guestProfileId: number;
  reservationDetailId: number;
  profileRoomCreatedOn: string;
  profileRoomCreatedBy: string;
}

interface GuestProfileMasterState {
  profile: GuestProfileMaster | null;
  loading: boolean;
  error: string | null;
}

const initialGuestProfileMasterState: GuestProfileMasterState = {
  profile: null,
  loading: false,
  error: null,
};

// Async thunk to fetch guest profile master by ID
export const fetchGuestProfileMasterById = createAsyncThunk<
  GuestProfileMaster,
  number
>("guestProfileMaster/fetchById", async (id, thunkAPI) => {
  try {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens?.accessToken;

    const response = await axios.get<GuestProfileMaster>(
      `${BASE_URL}/api/GuestProfileMaster/${id}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data || "Request failed");
  }
});

const guestProfileMasterSlice = createSlice({
  name: "guestProfileMaster",
  initialState: initialGuestProfileMasterState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestProfileMasterById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuestProfileMasterById.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchGuestProfileMasterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const guestProfileMasterReducer = guestProfileMasterSlice.reducer;
