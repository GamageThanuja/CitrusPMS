// redux/slices/roomMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---- Types ----
export interface RoomMasItem {
  roomID: number;
  finAct: boolean;
  roomStatusID: number;
  roomNumber: string;
  roomTypeID: number;
  blockID: number;
  floorID: number;
  description: string | null;
  hotelCode: string;
  createdBy: string | null;
  createdOn: string | null; // ISO
  roomSizeID: number;
  statusColour: string | null;
  houseKeepingStatusID: number;
  remarks: string | null;
  assignTo: string | null;
  category: string | null;
  alias: string | null;
  accountID: number;
  apertmentOwner_Name: string | null;
  apertmentOwner_Address: string | null;
  apertmentOwner_ContactNo: string | null;
  apertmentOwner_Email: string | null;
  lockNo: string | null;
  bedType: string | null;
  lockNom: string | null;
  // Allow unknown props
  [k: string]: any;
}

export interface FetchRoomMasParams {
  roomTypeId?: number;
  roomId?: number;
  roomNumber?: string;
}

interface RoomMasState {
  loading: boolean;
  error: string | null;
  items: RoomMasItem[];
  lastQuery: FetchRoomMasParams | null;
}

const initialState: RoomMasState = {
  loading: false,
  error: null,
  items: [],
  lastQuery: null,
};

// ---- Thunk: GET /api/RoomMas ----
// Uses shared axios client baseURL. Example resolved URL:
//   https://api.citruspms.app/api/RoomMas?hotelCode=1097&roomTypeId=1
// NOTE: API in Swagger shows query params: roomTypeId, roomId, roomNumber
export const fetchRoomMas = createAsyncThunk<
  RoomMasItem[],
  FetchRoomMasParams | void,
  { rejectValue: string }
>("roomMas/fetchRoomMas", async (params, { rejectWithValue }) => {
  try {
    // Build query params. We also include hotelCode from localStorage if present.
    const hotelCode =
      typeof window !== "undefined"
        ? localStorage.getItem("hotelCode") || "1097"
        : "1097";

    const query: Record<string, any> = { hotelCode };
    if (params?.roomTypeId != null) query.roomTypeId = params.roomTypeId;
    if (params?.roomId != null) query.roomId = params.roomId;
    if (params?.roomNumber) query.roomNumber = params.roomNumber;

    const queryString = new URLSearchParams(query).toString();
    const url = `${API_BASE_URL}/api/RoomMas?${queryString}`;
    const res = await axios.get(url);
    const data = Array.isArray(res.data) ? (res.data as RoomMasItem[]) : [];
    return data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to fetch RoomMas.";
    return rejectWithValue(msg);
  }
});

// ---- Slice ----
const roomMasSlice = createSlice({
  name: "roomMas",
  initialState,
  reducers: {
    clearRoomMas(state) {
      state.items = [];
      state.error = null;
      state.lastQuery = null;
    },
    updateRoomHousekeepingStatus(state, action: PayloadAction<{ roomID: number; houseKeepingStatusID: number }>) {
      const { roomID, houseKeepingStatusID } = action.payload;
      const room = state.items.find(item => item.roomID === roomID);
      if (room) {
        room.houseKeepingStatusID = houseKeepingStatusID;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomMas.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = (action.meta.arg as FetchRoomMasParams) || null;
      })
      .addCase(
        fetchRoomMas.fulfilled,
        (state, action: PayloadAction<RoomMasItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchRoomMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch RoomMas.";
      });
  },
});

export const { clearRoomMas, updateRoomHousekeepingStatus } = roomMasSlice.actions;
export default roomMasSlice.reducer;

// ---- Selectors ----
export const selectRoomMas = (state: any) => state.roomMas?.items as RoomMasItem[];
export const selectRoomMasLoading = (state: any) => state.roomMas?.loading as boolean;
export const selectRoomMasError = (state: any) => state.roomMas?.error as string | null;

