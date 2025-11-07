// redux/slices/deletePosCenterTaxConfigSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface DeletePosCenterTaxConfigState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: DeletePosCenterTaxConfigState = {
  loading: false,
  success: false,
  error: null,
};

export const deletePosCenterTaxConfig = createAsyncThunk(
  "posCenterTaxConfig/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const res = await fetch(`${BASE_URL}/api/HotelPOSCenterTaxConfig/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 204) {
        return { id }; // return deleted id for UI update
      } else if (res.status === 404) {
        const errorData = await res.json();
        return rejectWithValue(errorData);
      } else {
        const errorData = await res.json();
        return rejectWithValue(errorData);
      }
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const deletePosCenterTaxConfigSlice = createSlice({
  name: "deletePosCenterTaxConfig",
  initialState,
  reducers: {
    resetDeletePosCenterTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(deletePosCenterTaxConfig.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deletePosCenterTaxConfig.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(deletePosCenterTaxConfig.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetDeletePosCenterTaxConfigState } =
  deletePosCenterTaxConfigSlice.actions;

export default deletePosCenterTaxConfigSlice.reducer;
