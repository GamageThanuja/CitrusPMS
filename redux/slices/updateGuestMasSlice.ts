// src/redux/slices/updateGuestMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (mirrors API body) ---- */
export interface GuestMas {
  guestID: number;                // used in the path
  finAct: boolean | null;
  hotelCode: string | null;
  guestCode: string | null;
  guestName: string | null;
  phoneNo: string | null;
  nationality: string | null;
  email: string | null;
  nic: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  dob: string | null;             // ISO
  createdOn: string | null;       // ISO
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
  // allow extra props gracefully
  [k: string]: any;
}

/** ---- State ---- */
interface UpdateGuestMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: GuestMas | null;
}

const initialState: UpdateGuestMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/GuestsMas/{guestId} ---- */
export const updateGuestMas = createAsyncThunk<
  GuestMas,
  GuestMas,
  { rejectValue: string }
>("guestsMas/update", async (payload, { rejectWithValue }) => {
  try {
    const guestId = payload.guestID;
    const res = await axios.put(
      `${API_BASE_URL}/api/GuestsMas/${encodeURIComponent(String(guestId))}`,
      payload
    );
    return res.data as GuestMas;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update guest.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateGuestMasSlice = createSlice({
  name: "updateGuestMas",
  initialState,
  reducers: {
    resetUpdateGuestMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateGuestMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateGuestMas.fulfilled,
        (state, action: PayloadAction<GuestMas>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateGuestMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update guest.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateGuestMasState } = updateGuestMasSlice.actions;
export default updateGuestMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateGuestMasLoading = (s: any) =>
  (s.updateGuestMas?.loading as boolean) ?? false;
export const selectUpdateGuestMasError = (s: any) =>
  (s.updateGuestMas?.error as string | null) ?? null;
export const selectUpdateGuestMasSuccess = (s: any) =>
  (s.updateGuestMas?.success as boolean) ?? false;
export const selectUpdateGuestMasData = (s: any) =>
  (s.updateGuestMas?.data as GuestMas | null) ?? null;