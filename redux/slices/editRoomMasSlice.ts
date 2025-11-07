// src/redux/slices/editRoomMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Request body (trim/extend as needed) ---- */
export interface EditRoomMasPayload {
  roomID: number | null;
  finAct: boolean | null;
  roomStatusID: number | null;
  roomNumber: string | null;
  roomTypeID: number | null;
  blockID: number | null;
  floorID: number | null;
  description: string | null;
  hotelCode: string | null;
  createdBy: string | null;
  createdOn: string | null; // ISO
  roomSizeID: number | null;
  statusColour: string | null;
  houseKeepingStatusID: number | null;
  remarks: string | null;
  assignTo: string | null;
  category: string | null;
  alias: string | null;
  accountID: number | null;
  apertmentOwner_Name: string | null;
  apertmentOwner_Address: string | null;
  apertmentOwner_ContactNo: string | null;
  apertmentOwner_Email: string | null;
  lockNo: string | null;
  bedType: string | null;
  lockNom: string | null;

  // Allow unknown props safely
  [k: string]: any;
}

export interface EditRoomMasParams {
  roomTypeId: number;       // path param
  roomId: number;           // path param
  roomNumber: string;       // path param
  body: Partial<EditRoomMasPayload>; // only send what changes
}

export interface EditRoomMasState {
  loading: boolean;
  error: string | null;
  data: any | null; // update if backend returns a specific shape
  lastQuery: EditRoomMasParams | null;
  success: boolean;
}

const initialState: EditRoomMasState = {
  loading: false,
  error: null,
  data: null,
  lastQuery: null,
  success: false,
};

function normalizeResponse(res: any): any | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? res[0] : null;
  if (typeof res === "object") return res;
  return null;
}

/** ---- Thunk: PUT /api/RoomMas/{roomTypeId}/{roomId}/{roomNumber} ---- */
export const editRoomMas = createAsyncThunk<
  any | null,
  EditRoomMasParams,
  { rejectValue: string }
>("roomMas/edit", async (params, { rejectWithValue }) => {
  try {
    const { roomTypeId, roomId, roomNumber, body } = params;
    const url = `${API_BASE_URL}/api/RoomMas/${roomTypeId}/${roomId}/${encodeURIComponent(
      roomNumber
    )}`;
    const res = await axios.put(url, body);
    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update Room.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const editRoomMasSlice = createSlice({
  name: "editRoomMas",
  initialState,
  reducers: {
    clearEditRoomMas(state) {
      state.data = null;
      state.error = null;
      state.lastQuery = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(editRoomMas.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(
        editRoomMas.fulfilled,
        (state, action: PayloadAction<any | null>) => {
          state.loading = false;
          state.data = action.payload;
          state.success = true;
        }
      )
      .addCase(editRoomMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to update Room.";
      });
  },
});

export const { clearEditRoomMas } = editRoomMasSlice.actions;
export default editRoomMasSlice.reducer;

/** ---- Selectors ---- */
export const selectEditRoomMas = (s: any) =>
  (s.editRoomMas?.data as any) ?? null;
export const selectEditRoomMasLoading = (s: any) =>
  (s.editRoomMas?.loading as boolean) ?? false;
export const selectEditRoomMasError = (s: any) =>
  (s.editRoomMas?.error as string | null) ?? null;
export const selectEditRoomMasSuccess = (s: any) =>
  (s.editRoomMas?.success as boolean) ?? false;