import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface AvailableRoom {
  roomTypeID: number;
  roomType: string;
  finAct: boolean;
  roomId: number;
  roomNo: string;
}

interface AvailableRoomsState {
  data: {
    [roomTypeId: number]: AvailableRoom[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: AvailableRoomsState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchAvailableRooms = createAsyncThunk(
  "availableRooms/fetchAvailableRooms",
  async (
    {
      hotelRoomTypeId,
      checkInDate,
      checkOutDate,
    }: {
      hotelRoomTypeId: number;
      checkInDate: string;
      checkOutDate: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Get accessToken from localStorage
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // Get hotelId from selected property in localStorage
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      if (!accessToken || !hotelId) {
        return rejectWithValue("Missing access token or hotel ID");
      }

      const response = await axios.get(
        `${BASE_URL}/api/RoomType/available-rooms`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            hotelId,
            hotelRoomTypeId,
            checkInDate,
            checkOutDate,
          },
        }
      );

      return response.data as AvailableRoom[];
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.detail || "Failed to fetch available rooms."
      );
    }
  }
);

const availableRoomsSlice = createSlice({
  name: "availableRooms",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableRooms.fulfilled, (state, action) => {
        state.loading = false;
        const roomTypeId = action.meta.arg.hotelRoomTypeId;
        state.data[roomTypeId] = action.payload;
      })

      .addCase(fetchAvailableRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default availableRoomsSlice.reducer;
