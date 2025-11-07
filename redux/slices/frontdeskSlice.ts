// src/redux/slices/frontdeskSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Response Types (align with API) ---- */
export interface FrontDeskItem {
  guest1: string;
  id: number;
  checkIN: string; // ISO
  checkOUT: string; // ISO
  roomID: number;
  linkTo: number;
  reservationStatusID: number;
  reservationPaid: number;
  travelAgent: string;
  refNo: string;
  hotelCode: string;
  type: string;
  reservationDetailID: number;
  reservationDetailID2: number;
  basis: string;
  adults: number;
  child: number;
  roomNumber: string;
  reservationStatus: string;
  reservationStatusColour: string;
  reservationID: number;
  // allow extra fields gracefully
  [k: string]: any;
}

/** ---- Query Params ---- */
export interface FetchFrontDeskParams {
  hotelCode: string; // required
  checkIn?: string; // ISO
  checkOut?: string; // ISO
}

/** ---- Slice State ---- */
export interface FrontDeskState {
  loading: boolean;
  error: string | null;
  data: FrontDeskItem[];
  success: boolean;
  lastQuery: FetchFrontDeskParams | null;
}

const initialState: FrontDeskState = {
  loading: false,
  error: null,
  data: [],
  success: false,
  lastQuery: null,
};

function normalizeArray(res: any): FrontDeskItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as FrontDeskItem[];
  if (typeof res === "object") return [res as FrontDeskItem];
  return [];
}

/** ---- Thunk: GET /api/frontdesk ---- */
export const fetchFrontDesk = createAsyncThunk<
  FrontDeskItem[],
  FetchFrontDeskParams,
  { rejectValue: string }
>("frontdesk/fetch", async (params, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/frontdesk`;
    const { hotelCode, checkIn, checkOut } = params || ({} as FetchFrontDeskParams);

    const res = await axios.get(url, {
      params: {
        hotelCode,
        checkIn,
        checkOut,
      },
    });

    return normalizeArray(res.data);
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Failed to fetch frontdesk data.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const frontdeskSlice = createSlice({
  name: "frontdesk",
  initialState,
  reducers: {
    clearFrontDesk(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
      state.success = false;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFrontDesk.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(fetchFrontDesk.fulfilled, (state, action: PayloadAction<FrontDeskItem[]>) => {
        state.loading = false;
        state.data = action.payload ?? [];
        state.success = true;
      })
      .addCase(fetchFrontDesk.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch frontdesk data.";
      });
  },
});

export const { clearFrontDesk } = frontdeskSlice.actions;
export default frontdeskSlice.reducer;

/** ---- Selectors ---- */
export const selectFrontDeskData = (s: any) => (s.frontdesk?.data as FrontDeskItem[]) ?? [];
export const selectFrontDeskLoading = (s: any) => (s.frontdesk?.loading as boolean) ?? false;
export const selectFrontDeskError = (s: any) => (s.frontdesk?.error as string | null) ?? null;
export const selectFrontDeskSuccess = (s: any) => (s.frontdesk?.success as boolean) ?? false;
