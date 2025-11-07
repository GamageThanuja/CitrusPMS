// src/redux/slices/createHotelEmployeeSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface CreateHotelEmployeePayload {
  hotelId?: number; // optional; will default to selectedProperty.id
  empNo: string;
  empName: string;
  dateOfJoined: string; // ISO string
  status: string;
  department: string;
  phone: string;
  email: string;
  finAct: boolean;
  createdBy: string;
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

interface CreateHotelEmployeeState {
  data: HotelEmployeeResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: CreateHotelEmployeeState = {
  data: null,
  loading: false,
  error: null,
};

export const createHotelEmployee = createAsyncThunk<
  HotelEmployeeResponse,
  CreateHotelEmployeePayload
>("hotelEmployee/createHotelEmployee", async (payload, thunkAPI) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsed?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const fallbackHotelId: number | undefined = property?.id;

    const body = {
      ...payload,
      hotelId: payload.hotelId ?? fallbackHotelId,
    };

    if (!accessToken) throw new Error("Missing access token");
    if (!body.hotelId) throw new Error("Missing hotelId");

    const res = await axios.post(`${BASE_URL}/api/HotelEmployee`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
      },
      // some backends reply text/plain with JSON string
      transformResponse: [(data) => data],
      validateStatus: (s) => s >= 200 && s < 300,
    });

    // parse if server sent text/plain
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
      "Failed to create employee";
    return thunkAPI.rejectWithValue(msg);
  }
});

const createHotelEmployeeSlice = createSlice({
  name: "createHotelEmployee",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createHotelEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(createHotelEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createHotelEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to create employee";
      });
  },
});

export default createHotelEmployeeSlice.reducer;
