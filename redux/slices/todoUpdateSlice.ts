// src/redux/slices/todoUpdateSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
export interface ToDoTask {
  taskId: number;
  hotelId: number;
  finAct: boolean;
  taskCategory: string;
  task: string;
  reservationId?: number | null;
  reservationDetailId?: number | null;
  isTaskCompleted: boolean;
  createdOn?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedOn?: string;
  completedOn?: string;
  completedBy?: string;
}

export type ToDoTaskUpdate = Partial<Omit<ToDoTask, "taskId" | "hotelId">> & {
  taskId?: number; // optional; path param is the source of truth
  hotelId?: number; // optional; defaults from localStorage
  updatedBy?: string; // commonly set on update
  completedBy?: string; // set if completing via this call
};

type UpdateStatus = "idle" | "loading" | "succeeded" | "failed";

interface ToDoUpdateState {
  status: UpdateStatus;
  error?: string | null;
  data?: ToDoTask | null;
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
export const updateToDoTask = createAsyncThunk<
  ToDoTask,
  { id: number; changes: ToDoTaskUpdate }
>("todo/update", async ({ id, changes }, { rejectWithValue }) => {
  try {
    const { accessToken, hotelId } = getAuthAndHotel();
    if (!accessToken)
      return rejectWithValue("Access token not found in localStorage");

    // Build request body (PUT usually expects the full resource, but
    // we'll send a safe merge of provided fields plus hotelId/taskId).
    const body: any = {
      ...changes,
      taskId: id,
      hotelId: typeof changes.hotelId === "number" ? changes.hotelId : hotelId,
    };

    const res = await axios.put<ToDoTask>(
      `${API_BASE_URL}/api/ToDoList/${id}`,
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
      (err?.response?.status === 404 ? "Task not found" : undefined) ||
      err?.message ||
      "Failed to update task";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: ToDoUpdateState = {
  status: "idle",
  error: null,
  data: null,
};

const todoUpdateSlice = createSlice({
  name: "todoUpdate",
  initialState,
  reducers: {
    resetToDoUpdate(state) {
      state.status = "idle";
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateToDoTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateToDoTask.fulfilled,
        (state, action: PayloadAction<ToDoTask>) => {
          state.status = "succeeded";
          state.data = action.payload;
        }
      )
      .addCase(updateToDoTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to update task";
      });
  },
});

export const { resetToDoUpdate } = todoUpdateSlice.actions;
export default todoUpdateSlice.reducer;

/* ----------------------------- Selectors ----------------------------- */
export const selectToDoUpdateStatus = (s: any) =>
  (s.todoUpdate as ToDoUpdateState).status;
export const selectToDoUpdateError = (s: any) =>
  (s.todoUpdate as ToDoUpdateState).error;
export const selectToDoUpdateData = (s: any) =>
  (s.todoUpdate as ToDoUpdateState).data;
