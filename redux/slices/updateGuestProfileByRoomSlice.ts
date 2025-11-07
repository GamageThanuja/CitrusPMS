import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

/** ---- Types ---- */
export interface UpdateGuestProfileByRoomPayload {
  recordId: number;
  finAct: boolean;
  guestProfileId: number;
  reservationDetailId: number;
  createdBy: string;
}

export interface UpdateGuestProfileByRoomResponse {
  recordId: number;
  finAct: boolean;
  guestProfileId: number;
  reservationDetailId: number;
  createdOn: string; // e.g. "2025-08-22T09:50:00.265Z"
  createdBy: string;
}

interface State {
  data: UpdateGuestProfileByRoomResponse | null;
  loading: boolean;
  error: string | null;
}

/** ---- Initial ---- */
const initialState: State = {
  data: null,
  loading: false,
  error: null,
};

/** ---- Thunk ---- */
export const updateGuestProfileByRoom = createAsyncThunk<
  UpdateGuestProfileByRoomResponse,
  UpdateGuestProfileByRoomPayload,
  { rejectValue: string }
>("guestProfileByRoom/update", async (body, { rejectWithValue }) => {
  try {
    // Tokens & property
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;

    if (!accessToken) {
      return rejectWithValue("No access token found.");
    }

    // You can centralize this base URL if you prefer
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const url = `${baseURL}/api/GuestProfileByRoomMaster`;

    const res = await axios.put<UpdateGuestProfileByRoomResponse>(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "text/plain",
      },
      // If your backend expects hotel id, pass it here.
      // If your API doesn't need it, you can remove `params`.
      params: hotelId ? { hotelId } : undefined,
    });

    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.message ||
      "Failed to update guest profile by room.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateGuestProfileByRoomSlice = createSlice({
  name: "updateGuestProfileByRoom",
  initialState,
  reducers: {
    resetUpdateGuestProfileByRoom(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateGuestProfileByRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateGuestProfileByRoom.fulfilled,
        (state, action: PayloadAction<UpdateGuestProfileByRoomResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(
        updateGuestProfileByRoom.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || "Unknown error";
        }
      );
  },
});

export const { resetUpdateGuestProfileByRoom } =
  updateGuestProfileByRoomSlice.actions;

export default updateGuestProfileByRoomSlice.reducer;
