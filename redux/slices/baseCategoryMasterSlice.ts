// src/redux/slices/baseCategoryMasterSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "@/redux/store";

export type BaseCategory = {
  baseCategoryId: number;
  baseCategory: string;
  salesAccId: number;
  createdOn: string | null;
  createdBy: string | null;
};

type State = {
  data: BaseCategory[];
  loading: boolean;
  error: string | null;
  lastFetched?: number;
};

const initialState: State = {
  data: [],
  loading: false,
  error: null,
};

// If you already centralize this, swap to your existing baseURL util/env
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchBaseCategories = createAsyncThunk<
  BaseCategory[],
  void,
  { rejectValue: string }
>("baseCategoryMaster/fetch", async (_void, { rejectWithValue }) => {
  try {
    // Tokens & selected property
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property?.id as number | undefined;

    const res = await axios.get<BaseCategory[]>(
      `${API_BASE}/api/BaseCategoryMaster`,
      {
        headers: {
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(hotelId ? { "X-Hotel-Id": String(hotelId) } : {}),
        },
      }
    );

    // API returns array directly
    return res.data ?? [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to fetch base categories";
    return rejectWithValue(msg);
  }
});

const baseCategoryMasterSlice = createSlice({
  name: "baseCategoryMaster",
  initialState,
  reducers: {
    clearBaseCategories(state) {
      state.data = [];
      state.error = null;
      state.lastFetched = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBaseCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBaseCategories.fulfilled,
        (state, action: PayloadAction<BaseCategory[]>) => {
          state.loading = false;
          state.data = action.payload;
          state.lastFetched = Date.now();
        }
      )
      .addCase(fetchBaseCategories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch base categories";
      });
  },
});

export const { clearBaseCategories } = baseCategoryMasterSlice.actions;
export default baseCategoryMasterSlice.reducer;

// Selectors
export const selectBaseCategories = (state: RootState) =>
  state.baseCategoryMaster.data;

export const selectBaseCategoryById = (id: number) => (state: RootState) =>
  state.baseCategoryMaster.data.find((b) => b.baseCategoryId === id);

export const selectBaseCategoryLoading = (state: RootState) =>
  state.baseCategoryMaster.loading;

export const selectBaseCategoryError = (state: RootState) =>
  state.baseCategoryMaster.error;

export const selectBaseCategoryLastFetched = (state: RootState) =>
  state.baseCategoryMaster.lastFetched;
