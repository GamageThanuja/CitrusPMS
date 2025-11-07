// src/redux/slices/updateHotelEmployeeSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface UpdateHotelEmployeePayload {
  hotelId?: number; // will default to selectedProperty.id if omitted
  empNo: string;
  empName: string;
  dateOfJoined: string; // ISO string
  status: string;
  department: string;
  phone: string;
  email: string;
  finAct: boolean;
}

export interface HotelEmployeeResponse {
  empId: number;
  hotelId: number;
  empNo: string;
  empName: string;
  dateOfJoined: string;
  status: string;
  department: string;
  phone: string;
  email: string;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
}

interface UpdateHotelEmployeeState {
  data: HotelEmployeeResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: UpdateHotelEmployeeState = {
  data: null,
  loading: false,
  error: null,
};

type UpdateArgs = { id: number; data: UpdateHotelEmployeePayload };

export const updateHotelEmployee = createAsyncThunk<
  HotelEmployeeResponse,
  UpdateArgs
>("hotelEmployee/update", async ({ id, data }, thunkAPI) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsed?.accessToken;

    if (!accessToken) throw new Error("Missing access token");

    // Fallback hotelId from selectedProperty if not provided
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const fallbackHotelId: number | undefined = property?.id;

    const body = {
      ...data,
      hotelId: data.hotelId ?? fallbackHotelId,
    };

    if (!body.hotelId) throw new Error("Missing hotelId");

    const res = await axios.put(`${BASE_URL}/api/HotelEmployee/${id}`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        // API may return text/plain with JSON string:
        Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
      },
      transformResponse: [(d) => d],
      validateStatus: (s) => s >= 200 && s < 300,
    });

    const raw = res.data as unknown;
    const parsedData =
      typeof raw === "string"
        ? (JSON.parse(raw) as HotelEmployeeResponse)
        : (raw as HotelEmployeeResponse);

    return parsedData;
  } catch (error: any) {
    const msg =
      error?.response?.data?.detail ||
      error?.response?.data?.title ||
      error?.message ||
      "Failed to update employee";
    return thunkAPI.rejectWithValue(msg);
  }
});

const updateHotelEmployeeSlice = createSlice({
  name: "updateHotelEmployee",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(updateHotelEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateHotelEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to update employee";
      });
  },
});

export default updateHotelEmployeeSlice.reducer;
