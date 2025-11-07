// src/redux/slices/createPosCenterSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ------------ Types ------------ */
export type CreatePosCenterRequest = {
  posCenter: string;
  serviceCharge?: number;
  taxes?: number;
  createdBy?: string;
  kotPrinter?: string;
  billPrinter?: string;
  botPrinter?: string;
  billCopies?: number;
  isShowOnGSS?: boolean;
  outletCurrency?: string; // e.g. "USD"
  outletCurrencyId?: number;
};

export type PosCenterResponse = {
  hotelPosCenterId: number;
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy: string;
  createdOn: string; // ISO
  kotPrinter?: string;
  billPrinter?: string;
  botPrinter?: string;
  billCopies?: number;
  isShowOnGSS: boolean;
};

type Status = "idle" | "loading" | "succeeded" | "failed";

interface CreatePosCenterState {
  status: Status;
  data: PosCenterResponse | null;
  error: string | null;
}

/* ------------ Thunk ------------ */
export const createPosCenter = createAsyncThunk<
  PosCenterResponse,
  CreatePosCenterRequest,
  { rejectValue: string }
>("createPosCenter/create", async (payload, { rejectWithValue }) => {
  try {
    // tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    // hotel
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;

    if (!hotelId)
      return rejectWithValue("Missing hotelId (selectedProperty.id)");
    if (!accessToken) return rejectWithValue("Missing access token");

    const body = {
      hotelId,
      posCenter: payload.posCenter,
      serviceCharge: payload.serviceCharge ?? 0,
      taxes: payload.taxes ?? 0,
      createdBy: payload.createdBy ?? "system",
      kotPrinter: payload.kotPrinter ?? "",
      billPrinter: payload.billPrinter ?? "",
      botPrinter: payload.botPrinter ?? "",
      billCopies: payload.billCopies ?? 1,
      isShowOnGSS: payload.isShowOnGSS ?? true,
      outletCurrency: payload.outletCurrency ?? null,
      outletCurrencyId: payload.outletCurrencyId ?? null,
    };

    const res = await fetch(`${BASE_URL}/api/HotelPosCenter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    // 400/500 handling
    if (!res.ok) {
      // try to read server problem-details or text
      const ct = res.headers.get("content-type") || "";
      let detail = `${res.status} ${res.statusText}`;
      try {
        if (ct.includes("application/json")) {
          const j = await res.json();
          detail = j?.detail || j?.title || JSON.stringify(j);
        } else {
          detail = await res.text();
        }
      } catch {
        /* ignore parse errors */
      }
      return rejectWithValue(detail || "Request failed");
    }

    // spec says 201 returns object (media type text/plain but JSON body example)
    // try json first, fall back to text->json
    let data: any;
    try {
      data = await res.json();
    } catch {
      const t = await res.text();
      try {
        data = JSON.parse(t);
      } catch {
        return rejectWithValue("Unexpected response format from server");
      }
    }

    return data as PosCenterResponse;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Network error");
  }
});

/* ------------ Slice ------------ */
const initialState: CreatePosCenterState = {
  status: "idle",
  data: null,
  error: null,
};

const createPosCenterSlice = createSlice({
  name: "createPosCenter",
  initialState,
  reducers: {
    resetCreatePosCenter(state) {
      state.status = "idle";
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPosCenter.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        createPosCenter.fulfilled,
        (state, action: PayloadAction<PosCenterResponse>) => {
          state.status = "succeeded";
          state.data = action.payload;
        }
      )
      .addCase(createPosCenter.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) || "Failed to create POS center";
      });
  },
});

export const { resetCreatePosCenter } = createPosCenterSlice.actions;
export default createPosCenterSlice.reducer;

/* ------------ Selectors ------------ */
export const selectCreatePosCenterStatus = (s: RootState) =>
  s.createPosCenter.status;
export const selectCreatePosCenterData = (s: RootState) =>
  s.createPosCenter.data;
export const selectCreatePosCenterError = (s: RootState) =>
  s.createPosCenter.error;
