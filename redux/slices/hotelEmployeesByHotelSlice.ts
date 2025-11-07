// src/redux/slices/hotelEmployeesByHotelSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelEmployee {
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

interface HotelEmployeesState {
  data: HotelEmployee[];
  loading: boolean;
  error: string | null;
  success: boolean; // keep parity with your remark slice
}

const initialState: HotelEmployeesState = {
  data: [],
  loading: false,
  error: null,
  success: false,
};

export const fetchEmployeesByHotel = createAsyncThunk<
  HotelEmployee[],
  number | undefined,
  { rejectValue: string }
>("hotelEmployees/fetchByHotel", async (hotelIdArg, { rejectWithValue }) => {
  try {
    // token
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;
    if (!accessToken) {
      return rejectWithValue("Missing access token");
    }

    // hotel id (arg first, then selectedProperty.id)
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined =
      (typeof hotelIdArg === "number" ? hotelIdArg : undefined) ?? property?.id;

    if (!hotelId) {
      return rejectWithValue("No hotel selected");
    }

    const url = `${BASE_URL}/api/HotelEmployee/hotel/${hotelId}`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
        "x-hotel-id": hotelId, // mirror your other slice's style
      },
      // Some servers return JSON with content-type text/plain
      transformResponse: [(data) => data],
      validateStatus: (s) => s >= 200 && s < 300,
      timeout: 15000,
    });

    const raw = res.data as unknown;

    // Safely parse: array | { data: [...] } | stringified JSON
    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return rejectWithValue("Invalid JSON received for employees");
    }

    const list: HotelEmployee[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data)
      ? parsed.data
      : [];

    return list;
  } catch (error: any) {
    const msg =
      error?.response?.data?.detail ||
      error?.response?.data?.title ||
      (typeof error?.response?.data === "string"
        ? error.response.data
        : error?.message) ||
      "Failed to fetch employees";
    return rejectWithValue(String(msg));
  }
});

const hotelEmployeesByHotelSlice = createSlice({
  name: "hotelEmployeesByHotel",
  initialState,
  reducers: {
    resetHotelEmployeesState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeesByHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchEmployeesByHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload ?? [];
      })
      .addCase(fetchEmployeesByHotel.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) ?? "Failed to fetch employees";
      });
  },
});

export const { resetHotelEmployeesState } = hotelEmployeesByHotelSlice.actions;
export default hotelEmployeesByHotelSlice.reducer;
