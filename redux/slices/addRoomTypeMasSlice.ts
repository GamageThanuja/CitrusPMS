import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

// Types
export interface RoomTypeMasCreateRequest {
  roomTypeID?: number;
  finAct: boolean;
  roomType: string;
  stOccupancy: number;
  maxOccupancy: number;
  description: string;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  isVirtualRoom: boolean;
  noOfRooms: number;
  shortCode: string;
  glAccountID: number;
  glAccountCode: string;
  mainImageURL: string;
  maxAdult: number;
  maxChild: number;
  cmid: string;
  seq: number;
  bedType: string;
  roomSize: string;
}

export interface RoomTypeMasCreateResponse {
  roomTypeID: number;
  finAct: boolean;
  roomType: string;
  stOccupancy: number;
  maxOccupancy: number;
  description: string;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  isVirtualRoom: boolean;
  noOfRooms: number;
  shortCode: string;
  glAccountID: number;
  glAccountCode: string;
  mainImageURL: string;
  maxAdult: number;
  maxChild: number;
  cmid: string;
  seq: number;
  bedType: string;
  roomSize: string;
}

interface AddRoomTypeMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  createdRoomType: RoomTypeMasCreateResponse | null;
}

const initialState: AddRoomTypeMasState = {
  loading: false,
  error: null,
  success: false,
  createdRoomType: null,
};

// ==========================================
// ✅ CREATE ROOM TYPE (NO TOKEN, USES BASE_URL)
// ==========================================

export const createRoomTypeMas = createAsyncThunk<
  RoomTypeMasCreateResponse,
  RoomTypeMasCreateRequest,
  { rejectValue: string }
>("addRoomTypeMas/create", async (roomTypeData, { rejectWithValue }) => {
  try {
    const propertyString = localStorage.getItem("selectedProperty");

    if (!propertyString) {
      return rejectWithValue("No property selected");
    }

    const property = JSON.parse(propertyString);

    // Use NEXT_PUBLIC_API_BASE_URL
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBase) {
      return rejectWithValue("API base URL missing in environment variables");
    }

    const response = await fetch(`${apiBase}/api/RoomTypeMas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...roomTypeData,
        roomTypeID: 0, // Let server auto-generate
        hotelCode: property.hotelCode || property.code || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return rejectWithValue(
        errorData?.message || `HTTP error! Status: ${response.status}`
      );
    }

    const data: RoomTypeMasCreateResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Create room type failed:", error);
    return rejectWithValue(
      error instanceof Error ? error.message : "Failed to create room type"
    );
  }
});

// Slice
const addRoomTypeMasSlice = createSlice({
  name: "addRoomTypeMas",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.createdRoomType = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRoomTypeMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createRoomTypeMas.fulfilled,
        (state, action: PayloadAction<RoomTypeMasCreateResponse>) => {
          state.loading = false;
          state.success = true;
          state.createdRoomType = action.payload;
        }
      )
      .addCase(
        createRoomTypeMas.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || "Failed to create room type";
          state.success = false;
        }
      );
  },
});

// Export actions
export const { clearError, clearSuccess, resetState } =
  addRoomTypeMasSlice.actions;

// Export selectors
export const selectAddRoomTypeMasLoading = (state: RootState) =>
  state.addRoomTypeMas.loading;
export const selectAddRoomTypeMasError = (state: RootState) =>
  state.addRoomTypeMas.error;
export const selectAddRoomTypeMasSuccess = (state: RootState) =>
  state.addRoomTypeMas.success;
export const selectCreatedRoomType = (state: RootState) =>
  state.addRoomTypeMas.createdRoomType;

// Reducer
export default addRoomTypeMasSlice.reducer;
