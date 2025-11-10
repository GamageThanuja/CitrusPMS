// src/redux/slices/userMasAuthSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface UserMasAuthPayload {
  username: string;
  password: string;
  hotelCode: string;
}

export interface UserMasAuthState {
  loading: boolean;
  error: string | null;
  data: any | null;     // e.g., { accessToken, refreshToken, user, ... }
  success: boolean;
  lastUsername: string | null; // don't keep password in state
}

const initialState: UserMasAuthState = {
  loading: false,
  error: null,
  data: null,
  success: false,
  lastUsername: null,
};

function normalizeResponse(res: any): any | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? res[0] : null;
  if (typeof res === "object") return res;
  return null;
}

/** ---- Thunk: POST /api/UserMas/auth ---- */
export const userMasAuth = createAsyncThunk<
  any | null,
  UserMasAuthPayload,
  { rejectValue: string }
>("userMas/auth", async (body, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/UserMas/auth`;
    const res = await axios.post(url, body);
    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Authentication failed.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const userMasAuthSlice = createSlice({
  name: "userMasAuth",
  initialState,
  reducers: {
    clearUserMasAuth(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
      state.success = false;
      state.lastUsername = null;
    },
  },
extraReducers: (builder) => {
  builder
    .addCase(userMasAuth.pending, (state, action) => {
      state.loading = true;
      state.error = null;
      state.success = false;
      state.lastUsername = action.meta.arg?.username ?? null; // store username only
    })
    .addCase(userMasAuth.fulfilled, (state, action: PayloadAction<any | null>) => {
      state.loading = false;
      state.data = action.payload;
      state.success = true;

      // Save userID to localStorage if present
      if (action.payload?.userID) {
        localStorage.setItem("userID", action.payload.userID.toString());
      }
    })
    .addCase(userMasAuth.rejected, (state, action) => {
      state.loading = false;
      state.success = false;
      state.error = (action.payload as string) || "Authentication failed.";
    });
},

});

export const { clearUserMasAuth } = userMasAuthSlice.actions;
export default userMasAuthSlice.reducer;

/** ---- Selectors ---- */
export const selectUserMasAuthData = (s: any) => (s.userMasAuth?.data as any) ?? null;
export const selectUserMasAuthLoading = (s: any) =>
  (s.userMasAuth?.loading as boolean) ?? false;
export const selectUserMasAuthError = (s: any) =>
  (s.userMasAuth?.error as string | null) ?? null;
export const selectUserMasAuthSuccess = (s: any) =>
  (s.userMasAuth?.success as boolean) ?? false;
export const selectUserMasAuthLastUsername = (s: any) =>
  (s.userMasAuth?.lastUsername as string | null) ?? null;