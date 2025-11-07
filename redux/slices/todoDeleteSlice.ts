// src/redux/slices/todoDeleteSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ----------------------------- Types ----------------------------- */
type DeleteStatus = "idle" | "loading" | "succeeded" | "failed";

interface ToDoDeleteState {
  status: DeleteStatus;
  error?: string | null;
  lastDeletedId?: number | null;
}

/* ----------------------------- Helpers ----------------------------- */
function getAccessToken() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  return parsedToken?.accessToken as string | undefined;
}

/* ----------------------------- Thunk ----------------------------- */
export const deleteToDoTask = createAsyncThunk<number, number>(
  "todo/delete",
  async (id, { rejectWithValue }) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken)
        return rejectWithValue("Access token not found in localStorage");

      await axios.delete(`${API_BASE_URL}/api/ToDoList/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // API returns 204; just return the id to reducer
      return id;
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        (err?.response?.status === 404 ? "Task not found" : undefined) ||
        err?.message ||
        "Failed to delete task";
      return rejectWithValue(msg);
    }
  }
);

/* ----------------------------- Slice ----------------------------- */
const initialState: ToDoDeleteState = {
  status: "idle",
  error: null,
  lastDeletedId: null,
};

const todoDeleteSlice = createSlice({
  name: "todoDelete",
  initialState,
  reducers: {
    resetToDoDelete(state) {
      state.status = "idle";
      state.error = null;
      state.lastDeletedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteToDoTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.lastDeletedId = null;
      })
      .addCase(
        deleteToDoTask.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.status = "succeeded";
          state.lastDeletedId = action.payload;
        }
      )
      .addCase(deleteToDoTask.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to delete task";
      });
  },
});

export const { resetToDoDelete } = todoDeleteSlice.actions;
export default todoDeleteSlice.reducer;

/* ----------------------------- Selectors ----------------------------- */
export const selectToDoDeleteStatus = (s: any) =>
  (s.todoDelete as ToDoDeleteState).status;
export const selectToDoDeleteError = (s: any) =>
  (s.todoDelete as ToDoDeleteState).error;
export const selectToDoLastDeletedId = (s: any) =>
  (s.todoDelete as ToDoDeleteState).lastDeletedId;
