// src/redux/slices/todoCreateSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export type ToDoTaskCategory =
  | "Housekeeping"
  | "FrontOffice"
  | "Maintenance"
  | "Finance"
  | "General"
  | string;

export interface ToDoTaskCreate {
  finAct?: boolean; // default true if not provided
  taskCategory: ToDoTaskCategory;
  task: string;
  reservationId?: number | null;
  reservationDetailId?: number | null;
  isTaskCompleted?: boolean; // default false if not provided
  createdBy?: string; // optional
}

export interface ToDoTaskResponse {
  taskId: number;
  hotelId: number;
  finAct: boolean;
  taskCategory: string;
  task: string;
  reservationId?: number | null;
  reservationDetailId?: number | null;
  isTaskCompleted: boolean;
  createdOn: string;
  createdBy?: string;
  updatedBy?: string;
  updatedOn?: string;
  completedOn?: string;
  completedBy?: string;
}

type CreateStatus = "idle" | "loading" | "succeeded" | "failed";

interface ToDoCreateState {
  status: CreateStatus;
  error?: string | null;
  data?: ToDoTaskResponse | null;
}

/* ----------------------------- Helpers ----------------------------- */
function getAuthAndHotel() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId: number | undefined = property?.id;

  return { accessToken, hotelId };
}

/* ----------------------------- Thunk ----------------------------- */
export const createToDoTask = createAsyncThunk<
  ToDoTaskResponse,
  ToDoTaskCreate
>("todo/create", async (payload, { rejectWithValue }) => {
  try {
    const { accessToken, hotelId } = getAuthAndHotel();
    if (!hotelId) {
      return rejectWithValue("Hotel ID not found in localStorage");
    }
    if (!accessToken) {
      return rejectWithValue("Access token not found in localStorage");
    }

    const body = {
      hotelId,
      finAct: payload.finAct ?? false,
      taskCategory: payload.taskCategory,
      task: payload.task,
      reservationId: payload.reservationId ?? 0,
      reservationDetailId: payload.reservationDetailId ?? 0,
      isTaskCompleted: payload.isTaskCompleted ?? false,
      createdBy: payload.createdBy ?? "SYSTEM",
    };

    const res = await axios.post<ToDoTaskResponse>(
      `${API_BASE_URL}/api/ToDoList`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create task";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: ToDoCreateState = {
  status: "idle",
  error: null,
  data: null,
};

const todoCreateSlice = createSlice({
  name: "todoCreate",
  initialState,
  reducers: {
    resetToDoCreate(state) {
      state.status = "idle";
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createToDoTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.data = null;
      })
      .addCase(
        createToDoTask.fulfilled,
        (state, action: PayloadAction<ToDoTaskResponse>) => {
          state.status = "succeeded";
          state.data = action.payload;
        }
      )
      .addCase(createToDoTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to create task";
      });
  },
});

export const { resetToDoCreate } = todoCreateSlice.actions;
export default todoCreateSlice.reducer;

/* ----------------------------- Selectors ----------------------------- */
export const selectToDoCreateStatus = (s: any) =>
  (s.todoCreate as ToDoCreateState).status;
export const selectToDoCreateError = (s: any) =>
  (s.todoCreate as ToDoCreateState).error;
export const selectToDoCreateData = (s: any) =>
  (s.todoCreate as ToDoCreateState).data;
