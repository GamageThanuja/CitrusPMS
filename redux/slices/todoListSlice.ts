// src/redux/slices/todoListSlice.ts
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
  createdOn: string;
  createdBy?: string;
  updatedBy?: string;
  updatedOn?: string;
  completedOn?: string;
  completedBy?: string;
}

export interface ToDoListFilters {
  hotelId?: number; // if omitted, we’ll read from localStorage
  taskId?: number;
  isTaskCompleted?: boolean;
  reservationId?: number;
  reservationDetailId?: number;
}

type FetchStatus = "idle" | "loading" | "succeeded" | "failed";

interface ToDoListState {
  status: FetchStatus;
  error?: string | null;
  data: ToDoTask[];
  filters: ToDoListFilters;
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

function buildQueryParams(filters: ToDoListFilters): Record<string, any> {
  const params: Record<string, any> = {};
  if (typeof filters.hotelId === "number") params.hotelId = filters.hotelId;
  if (typeof filters.taskId === "number") params.taskId = filters.taskId;
  if (typeof filters.isTaskCompleted === "boolean")
    params.isTaskCompleted = filters.isTaskCompleted;
  if (typeof filters.reservationId === "number")
    params.reservationId = filters.reservationId;
  if (typeof filters.reservationDetailId === "number")
    params.reservationDetailId = filters.reservationDetailId;
  return params;
}

/* ----------------------------- Thunk ----------------------------- */
export const fetchToDoTasks = createAsyncThunk<
  ToDoTask[],
  ToDoListFilters | void
>("todo/list", async (maybeFilters, { rejectWithValue }) => {
  try {
    const { accessToken, hotelId } = getAuthAndHotel();
    if (!accessToken) {
      return rejectWithValue("Access token not found in localStorage");
    }

    const filters: ToDoListFilters = {
      ...maybeFilters,
      // Default hotelId from localStorage if not explicitly provided
      hotelId:
        typeof maybeFilters?.hotelId === "number"
          ? maybeFilters!.hotelId
          : hotelId,
    };

    const params = buildQueryParams(filters);

    const res = await axios.get<ToDoTask[]>(`${API_BASE_URL}/api/ToDoList`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    return res.data ?? [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch to-do tasks";
    return rejectWithValue(msg);
  }
});

/* ----------------------------- Slice ----------------------------- */
const initialState: ToDoListState = {
  status: "idle",
  error: null,
  data: [],
  filters: {},
};

const todoListSlice = createSlice({
  name: "todoList",
  initialState,
  reducers: {
    setToDoListFilters(state, action: PayloadAction<ToDoListFilters>) {
      state.filters = action.payload || {};
    },
    resetToDoList(state) {
      state.status = "idle";
      state.error = null;
      state.data = [];
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchToDoTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchToDoTasks.fulfilled,
        (state, action: PayloadAction<ToDoTask[]>) => {
          state.status = "succeeded";
          state.data = action.payload || [];
        }
      )
      .addCase(fetchToDoTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to fetch to-dos";
      });
  },
});

export const { setToDoListFilters, resetToDoList } = todoListSlice.actions;
export default todoListSlice.reducer;

/* ----------------------------- Selectors ----------------------------- */
export const selectToDoList = (s: any) => (s.todoList as ToDoListState).data;
export const selectToDoListStatus = (s: any) =>
  (s.todoList as ToDoListState).status;
export const selectToDoListError = (s: any) =>
  (s.todoList as ToDoListState).error;
export const selectToDoListFilters = (s: any) =>
  (s.todoList as ToDoListState).filters;
