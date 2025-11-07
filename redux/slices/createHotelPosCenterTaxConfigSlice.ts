import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface CreateHotelPosCenterTaxConfigPayload {
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string;
  percentage: number; // e.g. 10 for 10%
  calcBasedOn: string; // e.g. "base" | "sub1" | "sub2" ...
  createdBy: string;
  accountId?: number | null; // 👈 NEW (optional)
}

export interface HotelPosCenterTaxConfig {
  recordId: number;
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  accountId?: number | null; // 👈 include if your API returns it
}

interface State {
  data: HotelPosCenterTaxConfig | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: State = {
  data: null,
  status: "idle",
  error: null,
};

// NOTE: allow null when server returns no JSON body
export const createHotelPosCenterTaxConfig = createAsyncThunk<
  HotelPosCenterTaxConfig | null,
  // We still compute hotelId from localStorage, so caller does NOT have to pass it.
  Omit<CreateHotelPosCenterTaxConfigPayload, "hotelId">,
  { rejectValue: string }
>("hotelPosCenterTaxConfig/create", async (payload, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!BASE_URL) throw new Error("API base URL is not configured.");
    if (!accessToken) throw new Error("Missing access token.");
    if (!hotelId) throw new Error("Missing hotelId.");

    // Pull out accountId so we can conditionally include it
    const { accountId, ...rest } = payload;

    const body: any = {
      ...rest,
      hotelId,
      // Only include the key if provided; or send null if you prefer explicit nulls
      ...(accountId !== undefined ? { accountId } : {}),
    };

    const res = await fetch(`${BASE_URL}/api/HotelPOSCenterTaxConfig`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `HTTP ${res.status}`);
    }

    // Some endpoints return 204 / empty body
    if (res.status === 204) return null;

    const ct = res.headers.get("content-type") || "";
    const raw = await res.text().catch(() => "");
    if (!raw.trim()) return null;

    if (ct.includes("application/json") || ct.includes("text/plain")) {
      try {
        const parsed = JSON.parse(raw) as HotelPosCenterTaxConfig;
        return parsed ?? null;
      } catch {
        return null;
      }
    }
    return null;
  } catch (err: any) {
    return rejectWithValue(
      err?.message ?? "Failed to create POS Center Tax Config"
    );
  }
});

const createHotelPosCenterTaxConfigSlice = createSlice({
  name: "createHotelPosCenterTaxConfig",
  initialState,
  reducers: {
    resetCreateHotelPosCenterTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelPosCenterTaxConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.data = null;
      })
      .addCase(createHotelPosCenterTaxConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload ?? null; // may be null when no body
      })
      .addCase(createHotelPosCenterTaxConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || "Failed to create POS Center Tax Config";
      });
  },
});

export const { resetCreateHotelPosCenterTaxConfigState } =
  createHotelPosCenterTaxConfigSlice.actions;

export default createHotelPosCenterTaxConfigSlice.reducer;
