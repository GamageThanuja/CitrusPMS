// redux/slices/deleteHotelTaxConfigSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
interface DeleteState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DeleteState = {
  status: "idle",
  error: null,
};

// Thunk
export const deleteHotelTaxConfig = createAsyncThunk(
  "hotelTaxConfig/deleteHotelTaxConfig",
  async (id: number, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const res = await fetch(`${BASE_URL}/api/HotelTaxConfig/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 204) {
        return { id };
      } else if (res.status === 404) {
        throw new Error("Hotel tax configuration not found");
      } else {
        throw new Error("Failed to delete hotel tax configuration");
      }
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Slice
const deleteHotelTaxConfigSlice = createSlice({
  name: "deleteHotelTaxConfig",
  initialState,
  reducers: {
    resetDeleteHotelTaxConfigState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHotelTaxConfig.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteHotelTaxConfig.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(deleteHotelTaxConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetDeleteHotelTaxConfigState } =
  deleteHotelTaxConfigSlice.actions;

export const selectDeleteHotelTaxConfig = (state: any) =>
  state.deleteHotelTaxConfig;

export default deleteHotelTaxConfigSlice.reducer;
