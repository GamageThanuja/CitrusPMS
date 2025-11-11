import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface UserMas {
  userID: number;
  finAct: boolean;
  name: string;
  userName: string;
  password: string;
  hotelCode: string;
  email: string;
  superiorEmail: string;
  creditLimit: number;
  creditLimitAppPermission: number;
  supervisor1: number;
  supervisor2: number;
  supervisor3: number;
  buid: number;
  lastUsed: string;
  defaultPropertyID: number;
  poS_AccID: number;
  department: string;
  isHOD: boolean;
  userRole: string;
  createdOn: string;
  pos: boolean;
  pin: string;
  isVOIDOrder: boolean;
  createdBy: string;
  cashier: boolean;
  admin: boolean;
  profilePic: string;
  noti_NewReservation: boolean;
  noti_ReservationAmendment: boolean;
  noti_CheckIn: boolean;
  noti_CheckOut: boolean;
  noti_ResError: boolean;
  noti_BBRelease: boolean;
  noti_TentativeRes: boolean;
  noti_Other: boolean;
  isRole: boolean;
  guid: string;
  isGlobalUser: boolean;
}

/** ---- Slice State ---- */
interface FetchUserMasState {
  loading: boolean;
  data: UserMas[];
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: FetchUserMasState = {
  loading: false,
  data: [],
  error: null,
};

/** ---- Thunk: GET /api/UserMas?hotelCode= ---- */
export const fetchUserMas = createAsyncThunk<
  UserMas[],
  void,
  { rejectValue: string }
>("userMas/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const hotelCode = localStorage.getItem("hotelCode");
    if (!hotelCode) {
      return rejectWithValue("Missing hotelCode in localStorage.");
    }

    const url = `${API_BASE_URL}/api/UserMas?hotelCode=${encodeURIComponent(
      hotelCode
    )}`;
    const response = await axios.get(url, {
      headers: { Accept: "text/plain" },
    });

    return response.data as UserMas[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch user master data.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchUserMasSlice = createSlice({
  name: "fetchUserMas",
  initialState,
  reducers: {
    resetUserMas(state) {
      state.loading = false;
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserMas.fulfilled,
        (state, action: PayloadAction<UserMas[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchUserMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? "Failed to fetch user master data.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUserMas } = fetchUserMasSlice.actions;
export default fetchUserMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUserMasData = (state: any) =>
  (state.fetchUserMas?.data as UserMas[]) ?? [];

export const selectUserMasLoading = (state: any) =>
  (state.fetchUserMas?.loading as boolean) ?? false;

export const selectUserMasError = (state: any) =>
  (state.fetchUserMas?.error as string | null) ?? null;
