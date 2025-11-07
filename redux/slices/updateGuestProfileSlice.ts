// redux/slices/updateGuestProfileSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Types
export interface GuestProfilePayload {
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

interface UpdateGuestProfileState {
  loading: boolean;
  error: string | null;
  data: GuestProfilePayload | null;
}

const initialState: UpdateGuestProfileState = {
  loading: false,
  error: null,
  data: null,
};

// Async thunk
export const updateGuestProfile = createAsyncThunk<
  GuestProfilePayload,
  { id: number; payload: GuestProfilePayload }
>("guestProfile/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    // Always ensure payload has correct hotelId
    const finalPayload = { ...payload, hotelId };

    const response = await axios.put<GuestProfilePayload>(
      `${BASE_URL}/api/GuestProfileMaster/${id}`,
      finalPayload,
      {
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.detail || err.message);
  }
});

// Slice
const updateGuestProfileSlice = createSlice({
  name: "updateGuestProfile",
  initialState,
  reducers: {
    resetUpdateGuestProfile: (state) => {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateGuestProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGuestProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateGuestProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetUpdateGuestProfile } = updateGuestProfileSlice.actions;
export default updateGuestProfileSlice.reducer;
