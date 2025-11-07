// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
type UpdateArgs = { id: number | string; finAct: boolean };

function buildHeaders() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId = property?.id;

  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) h.Authorization = `Bearer ${accessToken}`;
  if (hotelId) h["X-Property-Id"] = String(hotelId); // adjust header name if needed
  return h;
}

export const updateTransactionFinAct = createAsyncThunk(
  "transactions/updateFinAct",
  async ({ id, finAct, updatedBy }: UpdateArgs, { rejectWithValue }) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/Transaction/${id}`,
        { finAct, updatedBy },
        { headers: buildHeaders() }
      );
      // API returns 204; just echo what we sent so caller can use it
      return { id, finAct };
    } catch (err: any) {
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to update FinAct.";
      return rejectWithValue(msg);
    }
  }
);

// Minimal slice — no loading/error state.
// You can still register it in the store, but it doesn't track anything.
const updateTransactionFinActSlice = createSlice({
  name: "updateTransactionFinAct",
  initialState: {},
  reducers: {},
  extraReducers: () => {},
});

export default updateTransactionFinActSlice.reducer;
