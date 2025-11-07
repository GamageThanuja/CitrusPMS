// redux/slices/guestProfileByHotelIdSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchGuestProfiles = createAsyncThunk(
  "guestProfiles/fetchGuestProfiles",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!hotelId)
        return rejectWithValue("Hotel ID not found in localStorage");

      const res = await axios.get(
        `${BASE_URL}/api/GuestProfileMaster/hotel/${hotelId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            // Swagger shows text/plain; * / * avoids 406s if the server returns plain
            Accept: "*/*",
          },
        }
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || err.message || "Failed to fetch guest profiles"
      );
    }
  }
);

interface GuestProfile {
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

type Status = "idle" | "loading" | "succeeded" | "failed";
interface GuestProfileState {
  data: GuestProfile[];
  status: Status;
  error: string | null;
}

const initialState: GuestProfileState = {
  data: [],
  status: "idle",
  error: null,
};

const slice = createSlice({
  name: "guestProfiles",
  initialState,
  reducers: {
    resetGuestProfiles: (state) => {
      state.data = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchGuestProfiles.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    b.addCase(fetchGuestProfiles.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.data = action.payload;
    });
    b.addCase(fetchGuestProfiles.rejected, (state, action) => {
      state.status = "failed";
      state.error = (action.payload as string) ?? "Request failed";
    });
  },
});

export const { resetGuestProfiles } = slice.actions;
export default slice.reducer;

// ✅ Selector MUST match your store key
