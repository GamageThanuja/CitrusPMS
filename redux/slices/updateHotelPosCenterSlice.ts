// redux/slices/updateHotelPosCenterSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { axiosInstance } from "@/config/axiosConfig";

/** ---- API base ---- */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE = `${BASE_URL}/api/HotelPosCenter`;

/** ---- Types ---- */
export interface HotelPosCenterUpdateBody {
  hotelPosCenterId: number; // same as {id} path param
  hotelId: number; // filled from localStorage
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  kotPrinter?: string | null;
  billPrinter?: string | null;
  botPrinter?: string | null;
  billCopies?: number;
  isShowOnGSS?: boolean;
}

export interface HotelPosCenterResponse {
  hotelPosCenterId: number;
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy?: string;
  createdOn?: string;
  kotPrinter?: string | null;
  billPrinter?: string | null;
  botPrinter?: string | null;
  billCopies?: number;
  isShowOnGSS?: boolean;
}

/** The shape you’ll pass from UI (omit hotelId; we’ll inject it). */
export type UpdateHotelPosCenterPayload = Omit<
  HotelPosCenterUpdateBody,
  "hotelId"
>;

/** ---- Thunk ---- */
export const updateHotelPosCenter = createAsyncThunk<
  HotelPosCenterResponse,
  UpdateHotelPosCenterPayload,
  { rejectValue: { code?: number; message: string } }
>("hotelPosCenter/update", async (payload, { rejectWithValue }) => {
  try {
    // tokens & property from localStorage (as requested)
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;

    if (!accessToken) {
      return rejectWithValue({ message: "Missing access token." });
    }
    if (!hotelId) {
      return rejectWithValue({ message: "Missing selected hotelId." });
    }
    if (!payload?.hotelPosCenterId) {
      return rejectWithValue({
        message: "hotelPosCenterId is required for update.",
      });
    }

    const body: HotelPosCenterUpdateBody = {
      ...payload,
      hotelId,
    };

    // PUT /api/HotelPosCenter/{id}
    const url = `${API_BASE}/${payload.hotelPosCenterId}`;
    const res = await axiosInstance.put<HotelPosCenterResponse>(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (err) {
    const ax = err as AxiosError<any>;
    const code = ax.response?.status;
    // Try to surface API-provided error detail if present
    const apiDetail =
      (ax.response?.data &&
        (ax.response.data.detail || ax.response.data.title)) ||
      ax.message;
    return rejectWithValue({
      code,
      message:
        code === 404
          ? "Hotel POS center not found."
          : code === 400
          ? `Bad Request: ${apiDetail}`
          : `Request failed${code ? ` (HTTP ${code})` : ""}: ${apiDetail}`,
    });
  }
});

/** ---- Slice ---- */
interface UpdateHotelPosCenterState {
  data: HotelPosCenterResponse | null;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: UpdateHotelPosCenterState = {
  data: null,
  loading: false,
  success: false,
  error: null,
};

const updateHotelPosCenterSlice = createSlice({
  name: "updateHotelPosCenter",
  initialState,
  reducers: {
    resetUpdateHotelPosCenterState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelPosCenter.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        updateHotelPosCenter.fulfilled,
        (state, action: PayloadAction<HotelPosCenterResponse>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateHotelPosCenter.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          action.payload?.message ??
          action.error.message ??
          "Failed to update Hotel POS center.";
      });
  },
});

export const { resetUpdateHotelPosCenterState } =
  updateHotelPosCenterSlice.actions;

export default updateHotelPosCenterSlice.reducer;
