

// src/redux/slices/createCheckInSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API body) ---- */
export interface CreateGuestProfilePayload {
  guestID?: number;
  finAct?: boolean;
  hotelCode?: string;
  guestCode?: string;
  guestName?: string;
  phoneNo?: string;
  nationality?: string;
  email?: string;
  nic?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  dob?: string; // ISO
  createdOn?: string; // ISO
  isVIP?: boolean;
  isVeg?: boolean;
  comment?: string;
  isDisabled?: boolean;
  isAdult?: boolean;
  isChild?: boolean;
  isInfant?: boolean;
  ppurl?: string;
  title?: string;
  isWorkPermit?: boolean;
  bC_Name?: string;
  bC_Phone?: string;
  bC_Email?: string;
  aC_Name?: string;
  aC_Phone?: string;
  aC_Email?: string;
  createdBy?: string;
  type?: string;
  countryOfRes?: string;
  // Allow unknown props safely
  [k: string]: any;
}

export interface CreateCheckInState {
  loading: boolean;
  error: string | null;
  data: any | null;
  success: boolean;
  lastBody: CreateGuestProfilePayload | null;
}

const initialState: CreateCheckInState = {
  loading: false,
  error: null,
  data: null,
  success: false,
  lastBody: null,
};

function normalizeResponse(res: any): any | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? res[0] : null;
  if (typeof res === "object") return res;
  return null;
}

/** ---- Thunk: POST /api/CheckIn/CreateGuestProfile ---- */
// src/redux/slices/createCheckInSlice.ts
export interface CreateGuestProfilePayload {
  // …existing fields…
  /** not sent in body; used to build query params */
  reservationDetailsId?: number;
  username?: string;
}

export const createGuestProfileCheckIn = createAsyncThunk<
  any | null,
  CreateGuestProfilePayload,
  { rejectValue: string }
>("checkIn/createGuestProfile", async (body, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/CheckIn/CreateGuestProfile`;

    // pull off query-only fields; keep the rest as POST body
    const { reservationDetailsId, username, ...rest } = body || {};

    // username from localStorage (fallback provided)
    const fromLocal =
      (typeof window !== "undefined" &&
        (localStorage.getItem("rememberedUsername") || "").trim());

    // ensure reservationDetailsId is a number or undefined (axios omits undefined)
    const parsedResDetailId =
      typeof reservationDetailsId === "number"
        ? reservationDetailsId
        : Number.isFinite(Number(reservationDetailsId))
        ? Number(reservationDetailsId)
        : undefined;

    const res = await axios.post(url, rest, {
      params: {
        reservationDetailsId: parsedResDetailId,
        username: (username ?? fromLocal) || "hotelmate.dev@gmail.com",
      },
    });

    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create guest profile.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createCheckInSlice = createSlice({
  name: "createCheckIn",
  initialState,
  reducers: {
    clearCreateCheckIn(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
      state.success = false;
      state.lastBody = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGuestProfileCheckIn.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastBody = action.meta.arg ?? null;
      })
      .addCase(
        createGuestProfileCheckIn.fulfilled,
        (state, action: PayloadAction<any | null>) => {
          state.loading = false;
          state.data = action.payload;
          state.success = true;
        }
      )
      .addCase(createGuestProfileCheckIn.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to create guest profile.";
      });
  },
});

export const { clearCreateCheckIn } = createCheckInSlice.actions;
export default createCheckInSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateCheckInData = (s: any) => (s.createCheckIn?.data as any) ?? null;
export const selectCreateCheckInLoading = (s: any) => (s.createCheckIn?.loading as boolean) ?? false;
export const selectCreateCheckInError = (s: any) => (s.createCheckIn?.error as string | null) ?? null;
export const selectCreateCheckInSuccess = (s: any) => (s.createCheckIn?.success as boolean) ?? false;