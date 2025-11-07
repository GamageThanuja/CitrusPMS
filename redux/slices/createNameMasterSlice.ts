// src/store/slices/nameMasterSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface NameMasterPayload {
  nameID?: number;
  hotelID?: number;
  code: string;
  name: string;
  nameType: string;
  taType: string;
  finAct: boolean;
  createdBy: string;
  createdOn?: string;
  updatedOn?: string;
  updatedBy: string;
  hotelCode: number;
  tranCode: string;
  phoneNo: string;
  email: string;
  address: string;
  vatNo: string;
  commissionPercentage: number;
}

interface NameMasterState {
  loading: boolean;
  data: any;
  error: string | null;
}

const initialState: NameMasterState = {
  loading: false,
  data: null,
  error: null,
};

// Async thunk for POST /api/NameMaster
export const createNameMaster = createAsyncThunk(
  "nameMaster/createNameMaster",
  async (payload: NameMasterPayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const requestBody = {
        ...payload,
        hotelID: hotelId,
        createdOn: new Date().toISOString(),
        updatedOn: new Date().toISOString(),
      };

      const response = await axios.post(
        `${BASE_URL}/api/NameMaster`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const nameMasterSlice = createSlice({
  name: "nameMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createNameMaster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNameMaster.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createNameMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default nameMasterSlice.reducer;
