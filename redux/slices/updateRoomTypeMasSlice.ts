// redux/slices/updateRoomTypeMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface RoomTypeMas {
  roomTypeID: number;
  finAct: boolean;
  roomType: string;
  stOccupancy: number;
  maxOccupancy: number;
  description: string;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  isVirtualRoom: boolean;
  noOfRooms: number;
  shortCode: string;
  glAccountID: number;
  glAccountCode: string;
  mainImageURL: string;
  maxAdult: number;
  maxChild: number;
  cmid: string;
  seq: number;
  bedType: string;
  roomSize: string;
}

interface UpdateRoomTypeMasState {
  loading: boolean;
  error: string | null;
  data: RoomTypeMas[];
}

const initialState: UpdateRoomTypeMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: PUT /api/RoomTypeMas/{hotelCode} ---- */
export const updateRoomTypeMas = createAsyncThunk<
  RoomTypeMas,
  RoomTypeMas,
  { rejectValue: string }
>(
  "roomType/update",
  async (roomToUpdate, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/RoomTypeMas/${roomToUpdate.hotelCode}`,
        roomToUpdate
      );
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update room type.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const updateRoomTypeMasSlice = createSlice({
  name: "updateRoomTypeMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateRoomTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoomTypeMas.fulfilled, (state, action: PayloadAction<RoomTypeMas>) => {
        state.loading = false;
        const index = state.data.findIndex(r => r.roomTypeID === action.payload.roomTypeID);
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(updateRoomTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update room type.";
      });
  },
});

/** ---- Exports ---- */
export default updateRoomTypeMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateRoomTypeMasLoading = (state: any) =>
  state.updateRoomTypeMas?.loading ?? false;
export const selectUpdateRoomTypeMasError = (state: any) =>
  state.updateRoomTypeMas?.error ?? null;
export const selectUpdateRoomTypeMasData = (state: any) =>
  state.updateRoomTypeMas?.data ?? [];
