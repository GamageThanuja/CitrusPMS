

// redux/slices/roomTypeMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---- Types ----
export interface RoomTypeMasItem {
  roomTypeID: number;
  finAct: boolean;
  roomType: string;
  stOccupancy: number;
  maxOccupancy: number;
  description: string | null;
  hotelCode: string;
  createdBy: string | null;
  createdOn: string | null; // ISO
  isVirtualRoom: boolean;
  noOfRooms: number;
  shortCode: string | null;
  glAccountID: number;
  glAccountCode: string | null;
  mainImageURL: string | null;
  maxAdult: number;
  maxChild: number;
  cmid: string | null;
  seq: number;
  bedType: string | null;
  roomSize: string | null;
  // allow unknown props
  [k: string]: any;
}

interface RoomTypeMasState {
  loading: boolean;
  error: string | null;
  items: RoomTypeMasItem[];
}

const initialState: RoomTypeMasState = {
  loading: false,
  error: null,
  items: [],
};

// ---- Thunk: GET /api/RoomTypeMas ----
export const fetchRoomTypeMas = createAsyncThunk<
  RoomTypeMasItem[],
  void,
  { rejectValue: string }
>("roomTypeMas/fetchRoomTypeMas", async (_void, { rejectWithValue }) => {
  try {
    const hotelCode =
      typeof window !== "undefined"
        ? localStorage.getItem("hotelCode") || "1097"
        : "1097";

    const url = `${API_BASE_URL}/api/RoomTypeMas?hotelCode=${encodeURIComponent(hotelCode)}`;
    const res = await axios.get(url);
    const data = Array.isArray(res.data) ? (res.data as RoomTypeMasItem[]) : [];
    return data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to fetch RoomTypeMas.";
    return rejectWithValue(msg);
  }
});

// ---- Slice ----
const roomTypeMasSlice = createSlice({
  name: "roomTypeMas",
  initialState,
  reducers: {
    clearRoomTypeMas(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRoomTypeMas.fulfilled,
        (state, action: PayloadAction<RoomTypeMasItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchRoomTypeMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch RoomTypeMas.";
      });
  },
});

export const { clearRoomTypeMas } = roomTypeMasSlice.actions;
export default roomTypeMasSlice.reducer;

// ---- Selectors ----
export const selectRoomTypeMas = (state: any) => state.roomTypeMas?.items as RoomTypeMasItem[];
export const selectRoomTypeMasLoading = (state: any) => state.roomTypeMas?.loading as boolean;
export const selectRoomTypeMasError = (state: any) => state.roomTypeMas?.error as string | null;