// src/redux/slices/fetchAvailableRoomTypesSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface AvailableRoomTypeItem {
  roomTypeID: number;
  roomType: string;
  glAccountId: number;
  finAct: boolean;
  roomId: number;
  roomNo: string;
  [k: string]: any; // allow extra props gracefully
}

/** ---- State ---- */
export interface FetchAvailableRoomTypesState {
  loading: boolean;
  error: string | null;
  items: AvailableRoomTypeItem[];
  success: boolean;
}

const initialState: FetchAvailableRoomTypesState = {
  loading: false,
  error: null,
  items: [],
  success: false,
};

function normalizeArray(res: any): AvailableRoomTypeItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as AvailableRoomTypeItem[];
  if (typeof res === "object") return [res as AvailableRoomTypeItem];
  return [];
}

/** ---- Thunk: GET /api/RoomTypeMas/available-rooms?hotelCode=&hotelRoomTypeId=&checkInDate=&checkOutDate= ---- */
export interface FetchAvailableRoomTypesParams {
  hotelCode?: string;
  hotelRoomTypeId?: number; // as per Swagger name
  checkInDate?: string; // ISO date-time
  checkOutDate?: string; // ISO date-time
}

export const fetchAvailableRoomTypes = createAsyncThunk<
  AvailableRoomTypeItem[],
  FetchAvailableRoomTypesParams | undefined,
  { rejectValue: string }
>(
  "availableRoomTypes/fetchAll",
  async (params: FetchAvailableRoomTypesParams | undefined, { rejectWithValue }) => {
    try {
      const { hotelCode, hotelRoomTypeId, checkInDate, checkOutDate } = params ?? {};
      const qs = new URLSearchParams();
      if (hotelCode) qs.append("hotelCode", hotelCode);
      if (typeof hotelRoomTypeId === "number") qs.append("hotelRoomTypeId", String(hotelRoomTypeId));
      if (checkInDate) qs.append("checkInDate", checkInDate);
      if (checkOutDate) qs.append("checkOutDate", checkOutDate);

      const url = `${API_BASE_URL}/api/RoomTypeMas/available-rooms${qs.toString() ? `?${qs.toString()}` : ""}`;
      const res = await axios.get(url);
      return normalizeArray(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to fetch available room types.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const fetchAvailableRoomTypesSlice = createSlice({
  name: "fetchAvailableRoomTypes",
  initialState,
  reducers: {
    clearAvailableRoomTypes(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableRoomTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchAvailableRoomTypes.fulfilled,
        (state, action: PayloadAction<AvailableRoomTypeItem[]>) => {
          state.loading = false;
          state.items = action.payload ?? [];
          state.success = true;
        }
      )
      .addCase(fetchAvailableRoomTypes.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch available room types.";
      });
  },
});

export const { clearAvailableRoomTypes } = fetchAvailableRoomTypesSlice.actions;
export default fetchAvailableRoomTypesSlice.reducer;

/** ---- Selectors ---- */
export const selectAvailableRoomTypesItems = (s: any) =>
  (s.fetchAvailableRoomTypes?.items as AvailableRoomTypeItem[]) ?? [];

export const selectAvailableRoomTypesLoading = (s: any) =>
  (s.fetchAvailableRoomTypes?.loading as boolean) ?? false;

export const selectAvailableRoomTypesError = (s: any) =>
  (s.fetchAvailableRoomTypes?.error as string | null) ?? null;

export const selectAvailableRoomTypesSuccess = (s: any) =>
  (s.fetchAvailableRoomTypes?.success as boolean) ?? false;
