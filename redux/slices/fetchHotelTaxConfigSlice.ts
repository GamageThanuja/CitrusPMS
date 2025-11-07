// redux/slices/fetchHotelTaxConfigSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelTaxConfig {
  recordId: number;
  hotelId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  accountId?: number;
}

type Status = "idle" | "loading" | "succeeded" | "failed";

interface FetchHotelTaxConfigState {
  items: HotelTaxConfig[];
  status: Status;
  error: string | null;
}

const initialState: FetchHotelTaxConfigState = {
  items: [],
  status: "idle",
  error: null,
};

/**
 * Fetch hotel tax configurations for the selected property.
 * Reads accessToken and hotelId from localStorage:
 *  - hotelmateTokens -> accessToken
 *  - selectedProperty -> { id }
 */
export const fetchHotelTaxConfigs = createAsyncThunk<
  HotelTaxConfig[],
  void,
  { rejectValue: string }
>("hotelTaxConfig/fetchAllByHotel", async (_, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property.id;

    if (!accessToken) return rejectWithValue("Missing access token.");
    if (!hotelId && hotelId !== 0) return rejectWithValue("Missing hotelId.");

    const res = await fetch(`${BASE_URL}/api/HotelTaxConfig/hotel/${hotelId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return rejectWithValue(
        `Failed to fetch tax configs (${res.status}). ${text || ""}`.trim()
      );
    }

    const data = (await res.json()) as HotelTaxConfig[];
    return data ?? [];
  } catch (err: any) {
    return rejectWithValue(err?.message || "Unexpected error occurred.");
  }
});

const fetchHotelTaxConfigSlice = createSlice({
  name: "hotelTaxConfig",
  initialState,
  reducers: {
    resetHotelTaxConfigState: () => initialState,
    // Optional: allow local cache hydration or manual set
    setHotelTaxConfigs: (state, action: PayloadAction<HotelTaxConfig[]>) => {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelTaxConfigs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchHotelTaxConfigs.fulfilled,
        (state, action: PayloadAction<HotelTaxConfig[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        }
      )
      .addCase(fetchHotelTaxConfigs.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch hotel tax configs.";
      });
  },
});

export const { resetHotelTaxConfigState, setHotelTaxConfigs } =
  fetchHotelTaxConfigSlice.actions;

export default fetchHotelTaxConfigSlice.reducer;

// redux/slices/fetchHotelTaxConfigSlice.ts
export const selectHotelTaxConfigs = (state: RootState) =>
  state.hotelTaxConfig.items;
export const selectHotelTaxConfigsStatus = (state: RootState) =>
  state.hotelTaxConfig.status;
export const selectHotelTaxConfigsError = (state: RootState) =>
  state.hotelTaxConfig.error;
