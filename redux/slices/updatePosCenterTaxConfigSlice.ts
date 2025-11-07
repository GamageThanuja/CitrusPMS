// redux/slices/updatePosCenterTaxConfigSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface UpdatePosCenterTaxConfigPayload {
  recordId: number;
  hotelPOSCenterId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  updatedBy: string;
}

interface UpdatePosCenterTaxConfigState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: UpdatePosCenterTaxConfigState = {
  loading: false,
  success: false,
  error: null,
};

export const updatePosCenterTaxConfig = createAsyncThunk(
  "posCenterTaxConfig/update",
  async (payload: UpdatePosCenterTaxConfigPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const res = await fetch(
        `${BASE_URL}/api/HotelPOSCenterTaxConfig/${payload.recordId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            recordId: payload.recordId,
            hotelId,
            hotelPOSCenterId: payload.hotelPOSCenterId,
            taxName: payload.taxName,
            percentage: payload.percentage,
            calcBasedOn: payload.calcBasedOn,
            updatedBy: payload.updatedBy,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        return rejectWithValue(errorData);
      }

      return await res.json();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const updatePosCenterTaxConfigSlice = createSlice({
  name: "updatePosCenterTaxConfig",
  initialState,
  reducers: {
    resetUpdatePosCenterTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updatePosCenterTaxConfig.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updatePosCenterTaxConfig.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updatePosCenterTaxConfig.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetUpdatePosCenterTaxConfigState } =
  updatePosCenterTaxConfigSlice.actions;

export default updatePosCenterTaxConfigSlice.reducer;
