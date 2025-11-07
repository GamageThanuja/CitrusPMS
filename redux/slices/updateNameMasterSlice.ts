// redux/slices/updateNameMasterSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface NameMaster {
  nameID: number;
  hotelID: number;
  code: string;
  name: string;
  nameType: string;
  taType: string;
  finAct: boolean;
  createdBy: string;
  createdOn: string;
  updatedOn: string;
  updatedBy: string;
  hotelCode: number;
  tranCode: string;
  phoneNo: string;
  email: string;
  address: string;
  vatNo: string;
  commissionPercentage: number;
}

interface UpdateState {
  data: NameMaster | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// === Thunk: PUT NameMaster ===
export const updateNameMaster = createAsyncThunk<
  NameMaster,
  { id: number; payload: Partial<NameMaster> },
  { rejectValue: string }
>("nameMaster/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    // === Token ===
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // === Selected Property ===
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!hotelId) {
      return rejectWithValue("Hotel ID not found in localStorage");
    }

    const response = await axios.put(
      `${BASE_URL}/api/NameMaster/${id}`,
      {
        ...payload,
        hotelID: hotelId, // ✅ ensure correct hotel
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data as NameMaster;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.title || "Failed to update NameMaster"
    );
  }
});

// === Slice ===
const initialState: UpdateState = {
  data: null,
  status: "idle",
  error: null,
};

const updateNameMasterSlice = createSlice({
  name: "updateNameMaster",
  initialState,
  reducers: {
    resetUpdateNameMaster: (state) => {
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateNameMaster.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateNameMaster.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(updateNameMaster.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error occurred";
      });
  },
});

export const { resetUpdateNameMaster } = updateNameMasterSlice.actions;
export default updateNameMasterSlice.reducer;

// === Selector ===
export const selectUpdateNameMaster = (state: RootState) =>
  state.updateNameMaster;
