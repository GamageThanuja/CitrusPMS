// src/redux/slices/updateHotelTaxConfig.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelTaxConfig {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number; // 0-100
  calcBasedOn: string; // e.g., "Base", "Subtotal1", etc.
  createdOn?: string;
  createdBy?: string;
  accountId?: number | null; // ⬅️ keep nullable in the returned type
  updatedOn?: string;
  updatedBy?: string;
}

export interface UpdateHotelTaxConfigPayload {
  recordId: number; // path param {id}
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  updatedBy: string;
  accountId?: number | null; // ⬅️ allow caller to pass existing accountId
}

type Status = "idle" | "loading" | "succeeded" | "failed";

interface UpdateHotelTaxConfigState {
  item: HotelTaxConfig | null;
  status: Status;
  error: string | null;
}

const initialState: UpdateHotelTaxConfigState = {
  item: null,
  status: "idle",
  error: null,
};

// PUT /api/HotelTaxConfig/{id}
export const updateHotelTaxConfig = createAsyncThunk<
  HotelTaxConfig,
  UpdateHotelTaxConfigPayload,
  { rejectValue: string }
>("hotelTaxConfig/update", async (payload, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!accessToken) {
      return rejectWithValue("Missing access token");
    }
    if (!hotelId && hotelId !== 0) {
      return rejectWithValue("Missing selected property (hotelId)");
    }

    // Build body; only include accountId if the caller provided a defined value.
    // This avoids overwriting existing DB value with null.
    const body: any = {
      recordId: payload.recordId, // (ok if backend ignores)
      hotelId,
      taxName: payload.taxName,
      percentage: payload.percentage,
      calcBasedOn: payload.calcBasedOn,
      updatedBy: payload.updatedBy,
    };
    if (payload.accountId !== undefined && payload.accountId !== null) {
      body.accountId = payload.accountId;
    }

    const res = await fetch(
      `${BASE_URL}/api/HotelTaxConfig/${payload.recordId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/plain;q=0.9",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      let message = `Failed to update HotelTaxConfig (${res.status})`;
      try {
        const problem = JSON.parse(text);
        if (problem?.title || problem?.detail) {
          message = `${problem.title ?? "Error"}: ${
            problem.detail ?? ""
          }`.trim();
        }
      } catch {
        if (text) message = text;
      }
      return rejectWithValue(message);
    }

    const data = (await res.json()) as HotelTaxConfig;
    return data;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? "Network error");
  }
});

const updateHotelTaxConfigSlice = createSlice({
  name: "updateHotelTaxConfig",
  initialState,
  reducers: {
    resetUpdateHotelTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelTaxConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateHotelTaxConfig.fulfilled,
        (state, action: PayloadAction<HotelTaxConfig>) => {
          state.status = "succeeded";
          state.item = action.payload;
        }
      )
      .addCase(updateHotelTaxConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Request failed";
      });
  },
});

export const { resetUpdateHotelTaxConfigState } =
  updateHotelTaxConfigSlice.actions;

export default updateHotelTaxConfigSlice.reducer;
