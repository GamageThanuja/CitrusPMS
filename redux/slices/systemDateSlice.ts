import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface SystemDateState {
  value: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SystemDateState = {
  value: null,
  status: "idle",
  error: null,
};

// Thunk to fetch system date
export const fetchSystemDate = createAsyncThunk(
  "systemDate/fetchSystemDate",
  async (_, { rejectWithValue }) => {
    try {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const selected = selectedProperty ? JSON.parse(selectedProperty) : null;
      const guid = selected?.guid;

      if (!guid) throw new Error("Hotel GUID not found");

      const tokenString = localStorage.getItem("hotelmateTokens");
      const accessToken = tokenString
        ? JSON.parse(tokenString).accessToken
        : null;

      if (!accessToken) throw new Error("Access token not found");

      const res = await fetch(`${BASE_URL}/api/Hotel/hotel-guid/${guid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch hotel data");

      const data = await res.json();
      const hotelDate = data[0]?.hotelDate?.split("T")[0];
      return hotelDate;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const systemDateSlice = createSlice({
  name: "systemDate",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemDate.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSystemDate.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.value = action.payload;
      })
      .addCase(fetchSystemDate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default systemDateSlice.reducer;
