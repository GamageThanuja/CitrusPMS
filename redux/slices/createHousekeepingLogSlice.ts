// src/redux/slices/createHousekeepingLogSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
/** ---- Types ---- */
export interface CreateHousekeepingLogPayload {
  // Backend will require hotelId; we'll inject it from localStorage
  roomNo: string;
  hkLog: string; // brief job/log text
  status?: string; // e.g., "Created" | "Assigned" | "In-Progress" | "Finished"
  createdBy: string;
  remarks?: string;

  loggedBy?: string;
  housekeepingAttendant?: string;

  // Optional timestamps; if omitted we’ll send sensible defaults
  entryDate?: string; // ISO
  timeStamp?: string; // ISO
  loggedOn?: string; // ISO
  jobCreated_TimeStamp?: string; // ISO
  jobAssigned_TimeStamp?: string; // ISO
  jobFinished_TimeStamp?: string; // ISO

  isStarted?: boolean;
  isFinished?: boolean;
  jobAssignedBy?: string;
  jobFinishedBy?: string;
}

export interface HousekeepingLogResponse {
  id: number;
  hotelId: number;
  roomNo: string;
  entryDate: string;
  timeStamp: string;
  hkLog: string;
  createdBy: string;
  remarks: string | null;
  status: string | null;
  loggedBy: string | null;
  loggedOn: string | null;
  housekeepingAttendant: string | null;
  jobCreated_TimeStamp: string | null;
  jobAssigned_TimeStamp: string | null;
  jobFinished_TimeStamp: string | null;
  isStarted: boolean;
  isFinished: boolean;
  jobAssignedBy: string | null;
  jobFinishedBy: string | null;
}

interface CreateHKLogState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: HousekeepingLogResponse | null;
}

/** ---- Helpers ---- */
const nowISO = () => new Date().toISOString();

/**
 * Build the server payload:
 * - Inject hotelId from localStorage.selectedProperty
 * - Apply ISO defaults for timestamps if not provided
 */
function buildServerPayload(userPayload: CreateHousekeepingLogPayload) {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  if (!accessToken) {
    throw new Error("Missing access token. Please sign in again.");
  }

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId: number | undefined = property?.id;

  if (!hotelId) {
    throw new Error("No hotel selected. Please choose a property.");
  }

  const ts = nowISO();

  const {
    roomNo,
    hkLog,
    status,
    createdBy,
    remarks,
    loggedBy,
    housekeepingAttendant,
    entryDate,
    timeStamp,
    loggedOn,
    jobCreated_TimeStamp,
    jobAssigned_TimeStamp,
    jobFinished_TimeStamp,
    isStarted,
    isFinished,
    jobAssignedBy,
    jobFinishedBy,
  } = userPayload;

  // Minimal required fields check (roomNo, hkLog, createdBy)
  if (!roomNo || !hkLog || !createdBy) {
    throw new Error("roomNo, hkLog, and createdBy are required.");
  }

  // API expects:
  const payload = {
    hotelId,
    roomNo,
    hkLog,
    createdBy,
    status: status ?? "Created",
    remarks: remarks ?? null,

    loggedBy: loggedBy ?? null,
    housekeepingAttendant: housekeepingAttendant ?? null,

    entryDate: entryDate ?? ts,
    timeStamp: timeStamp ?? ts,
    loggedOn: loggedOn ?? ts,
    jobCreated_TimeStamp: jobCreated_TimeStamp ?? ts,
    jobAssigned_TimeStamp: jobAssigned_TimeStamp ?? null,
    jobFinished_TimeStamp: jobFinished_TimeStamp ?? null,

    isStarted: isStarted ?? false,
    isFinished: isFinished ?? false,
    jobAssignedBy: jobAssignedBy ?? null,
    jobFinishedBy: jobFinishedBy ?? null,
  };

  return { payload, accessToken };
}

/** ---- Thunk ---- */
export const createHousekeepingLog = createAsyncThunk<
  HousekeepingLogResponse,
  CreateHousekeepingLogPayload,
  { rejectValue: string }
>("housekeepingLog/create", async (userPayload, { rejectWithValue }) => {
  try {
    const { payload, accessToken } = buildServerPayload(userPayload);

    // If you have an API helper/baseURL, replace with that.

    const url = `${BASE_URL}/api/HousekeepingLogMaster`;

    const res = await axios.post<HousekeepingLogResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Swagger shows "text/plain" for "Controls Accept header"; accept both to be safe.
        Accept: "application/json, text/plain",
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (err: any) {
    // Normalize error text
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create housekeeping log.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const initialState: CreateHKLogState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

const createHousekeepingLogSlice = createSlice({
  name: "createHousekeepingLog",
  initialState,
  reducers: {
    resetCreateHousekeepingLogState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHousekeepingLog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.data = null;
      })
      .addCase(createHousekeepingLog.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(createHousekeepingLog.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Failed to create housekeeping log.";
      });
  },
});

export const { resetCreateHousekeepingLogState } =
  createHousekeepingLogSlice.actions;

export default createHousekeepingLogSlice.reducer;
