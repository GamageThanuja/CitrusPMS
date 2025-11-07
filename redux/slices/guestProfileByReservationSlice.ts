// redux/slices/guestProfileByReservationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import axios from "axios";

/** ---- Types ---- */
export interface GuestProfileByReservation {
  profileId: number;
  hotelId: number;
  title: string | null;
  guestName: string | null;
  dob: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  nationality: string | null;
  ppNo: string | null;
  phone: string | null;
  email: string | null;
  createdOn: string | null;
  createdBy: string | null;
  updatedOn: string | null;
  updatedBy: string | null;
  signatureURL: string | null;
  recordId: number | null;
  finAct: boolean;
  guestProfileId: number;
  reservationDetailId: number;
  profileRoomCreatedOn: string | null;
  profileRoomCreatedBy: string | null;
}

interface SliceState {
  data: GuestProfileByReservation | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: SliceState = {
  data: null,
  status: "idle",
  error: null,
};

/** ---- Thunk ---- */
export const fetchGuestProfileByReservationDetailId = createAsyncThunk<
  GuestProfileByReservation,
  number,
  { rejectValue: string }
>("guestProfileByReservation/fetch", async (reservationDetailId, thunkAPI) => {
  try {
    // tokens / property context (as requested)
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!accessToken) {
      return thunkAPI.rejectWithValue("Missing access token");
    }

    // base URL (env with fallback)
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const url = `${baseURL}/api/GuestProfileMaster/by-reservation/${reservationDetailId}`;

    const res = await axios.get<GuestProfileByReservation>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // If your API expects hotel id in a header, keep it. If not, it’s harmless.
        "X-Hotel-Id": hotelId ?? "",
        Accept: "application/json",
      },
    });

    return res.data;
  } catch (err: any) {
    // normalize common API errors
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        return thunkAPI.rejectWithValue(
          "Guest profile not found for this reservation."
        );
      }
      const msg =
        (err.response?.data as any)?.detail ||
        err.message ||
        "Failed to fetch guest profile.";
      return thunkAPI.rejectWithValue(msg);
    }
    return thunkAPI.rejectWithValue("Failed to fetch guest profile.");
  }
});

/** ---- Slice ---- */
const guestProfileByReservationSlice = createSlice({
  name: "guestProfileByReservation",
  initialState,
  reducers: {
    resetGuestProfileByReservation: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestProfileByReservationDetailId.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchGuestProfileByReservationDetailId.fulfilled,
        (state, action: PayloadAction<GuestProfileByReservation>) => {
          state.status = "succeeded";
          state.data = action.payload;
        }
      )
      .addCase(
        fetchGuestProfileByReservationDetailId.rejected,
        (state, action) => {
          state.status = "failed";
          state.error = (action.payload as string) || "Request failed";
          state.data = null;
        }
      );
  },
});

/** ---- Exports ---- */
export const { resetGuestProfileByReservation } =
  guestProfileByReservationSlice.actions;

export const selectGuestProfileByReservation = (state: RootState) =>
  state.guestProfileByReservation.data;

export const selectGuestProfileByReservationStatus = (state: RootState) =>
  state.guestProfileByReservation.status;

export const selectGuestProfileByReservationError = (state: RootState) =>
  state.guestProfileByReservation.error;

export default guestProfileByReservationSlice.reducer;
