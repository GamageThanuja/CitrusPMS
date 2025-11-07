// src/redux/slices/fetchGuestMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types from API ---- */
export interface GuestMasItem {
  guestID: number;
  finAct: boolean;
  hotelCode: string;
  guestCode: string | null;
  guestName: string;
  phoneNo: string | null;
  nationality: string | null;
  email: string | null;
  nic: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  dob: string | null;         // ISO
  createdOn: string | null;   // ISO
  isVIP: boolean | null;
  isVeg: boolean | null;
  comment: string | null;
  isDisabled: boolean | null;
  isAdult: boolean | null;
  isChild: boolean | null;
  isInfant: boolean | null;
  ppurl: string | null;
  title: string | null;
  isWorkPermit: boolean | null;
  bC_Name: string | null;
  bC_Phone: string | null;
  bC_Email: string | null;
  aC_Name: string | null;
  aC_Phone: string | null;
  aC_Email: string | null;
  createdBy: string | null;
  type: string | null;
  countryOfRes: string | null;
  // allow unknown props safely
  [k: string]: any;
}

export interface FetchGuestMasParams {
  hotelCode?: string;   // defaults from localStorage
  guestId?: number;
  email?: string;
  phoneNo?: string;
  name?: string;
}

/** ---- State ---- */
interface FetchGuestMasState {
  loading: boolean;
  error: string | null;
  items: GuestMasItem[];
  lastQuery: FetchGuestMasParams | null;
}

const initialState: FetchGuestMasState = {
  loading: false,
  error: null,
  items: [],
  lastQuery: null,
};

/** ---- Thunk: GET /api/GuestsMas ---- */
export const fetchGuestMas = createAsyncThunk<
  GuestMasItem[],
  FetchGuestMasParams | undefined,
  { rejectValue: string }
>("guestMas/fetch", async (params, { rejectWithValue }) => {
  const safeParams: FetchGuestMasParams = (params ?? {}) as FetchGuestMasParams;
  try {
    const hotelCodeFromLs =
      typeof window !== "undefined"
        ? localStorage.getItem("hotelCode")
        : "1097";

    const query: Record<string, any> = {
      hotelCode: safeParams.hotelCode ?? hotelCodeFromLs,
    };
    if (safeParams.guestId != null) query.guestId = safeParams.guestId;
    if (safeParams.email) query.email = safeParams.email;
    if (safeParams.phoneNo) query.phoneNo = safeParams.phoneNo;
    if (safeParams.name) query.name = safeParams.name;
    if ((safeParams as any).guestID != null && query.guestId == null) {
      query.guestId = (safeParams as any).guestID;
    }

    const qs = new URLSearchParams(query as any).toString();
    const url = `${API_BASE_URL}/api/GuestsMas?${qs}`;

    const res = await axios.get(url);
    const data = Array.isArray(res.data) ? (res.data as GuestMasItem[]) : [];
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch GuestsMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchGuestMasSlice = createSlice({
  name: "guestMas",
  initialState,
  reducers: {
    clearGuestMas(state) {
      state.items = [];
      state.error = null;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuestMas.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = (action.meta.arg as FetchGuestMasParams | undefined) ?? null;
      })
      .addCase(fetchGuestMas.fulfilled, (state, action: PayloadAction<GuestMasItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchGuestMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to fetch GuestsMas.";
      });
  },
});

export const { clearGuestMas } = fetchGuestMasSlice.actions;
export default fetchGuestMasSlice.reducer;

/** ---- Selectors ---- */
export const selectGuestMasItems = (s: any) =>
  (s.fetchGuestMas?.items as GuestMasItem[]) ?? [];
export const selectGuestMasLoading = (s: any) =>
  (s.fetchGuestMas?.loading as boolean) ?? false;
export const selectGuestMasError = (s: any) =>
  (s.fetchGuestMas?.error as string | null) ?? null;
export const selectGuestMasLastQuery = (s: any) =>
  (s.fetchGuestMas?.lastQuery as FetchGuestMasParams | null) ?? null;