// src/redux/slices/createGuestProfileByRoomSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface GuestProfileByRoom {
  recordId?: number;
  finAct: boolean;
  guestProfileId: number;
  reservationDetailId: number;
  createdOn?: string;
  createdBy: string;
}

interface CreateGuestProfileByRoomState {
  loading: boolean;
  error: string | null;
  data: GuestProfileByRoom | null;
}

const initialState: CreateGuestProfileByRoomState = {
  loading: false,
  error: null,
  data: null,
};

// Async thunk
export const createGuestProfileByRoom = createAsyncThunk<
  GuestProfileByRoom,
  Omit<GuestProfileByRoom, "recordId" | "createdOn"> // request body
>("guestProfileByRoom/create", async (payload, { rejectWithValue }) => {
  try {
    // Tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // Selected property
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    const response = await axios.post<GuestProfileByRoom>(
      `${BASE_URL}/api/GuestProfileByRoomMaster`,
      payload,
      {
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.detail ||
        err.message ||
        "Failed to create guest profile by room"
    );
  }
});

const createGuestProfileByRoomSlice = createSlice({
  name: "createGuestProfileByRoom",
  initialState,
  reducers: {
    clearGuestProfileByRoom: (state) => {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGuestProfileByRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGuestProfileByRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createGuestProfileByRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGuestProfileByRoom } =
  createGuestProfileByRoomSlice.actions;

export default createGuestProfileByRoomSlice.reducer;
