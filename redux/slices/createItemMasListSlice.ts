// src/redux/slices/createItemMasListSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types for /api/ItemMas/list ---- */
export interface ItemMasListItem {
  categoryID: number;
  itemID: number;
  hotelID: number;
  itemCode: string;
  itemName: string;
  description: string;
  salesAccountID: number;
  price: number;
  imageURL: string;
  finAct: boolean;
  createdBy: number | string;
  createdOn: string;  // ISO date
  updatedBy: string | number;
  updatedOn: string;  // ISO date
}

/** ---- State ---- */
interface CreateItemMasListState {
  loading: boolean;
  success: boolean;
  error: string | null;
  createdItems: ItemMasListItem[]; // response from API
}

const initialState: CreateItemMasListState = {
  loading: false,
  success: false,
  error: null,
  createdItems: [],
};

/** ---- Thunk: POST /api/ItemMas/list ----
 *  Body: ItemMasListItem[]
 */
export const createItemMasList = createAsyncThunk<
  ItemMasListItem[],        // return type
  ItemMasListItem[],        // argument type (payload we send)
  { rejectValue: string }
>("itemMasList/create", async (items, { rejectWithValue }) => {
  try {
    // If you want to make sure dates are valid ISO, you can map here.
    const normalizedItems = items.map((it) => ({
      ...it,
      createdOn: new Date(it.createdOn || new Date()).toISOString(),
      updatedOn: new Date(it.updatedOn || new Date()).toISOString(),
    }));

    const response = await axios.post(
      `${API_BASE_URL}/api/ItemMas/list`,
      normalizedItems
    );

    return response.data as ItemMasListItem[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to create ItemMas list.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createItemMasListSlice = createSlice({
  name: "createItemMasList",
  initialState,
  reducers: {
    resetCreateItemMasListState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.createdItems = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createItemMasList.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        createItemMasList.fulfilled,
        (state, action: PayloadAction<ItemMasListItem[]>) => {
          state.loading = false;
          state.success = true;
          state.createdItems = action.payload;
        }
      )
      .addCase(createItemMasList.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create ItemMas list.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateItemMasListState } = createItemMasListSlice.actions;
export default createItemMasListSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateItemMasListLoading = (s: any) =>
  (s.createItemMasList?.loading as boolean) ?? false;
export const selectCreateItemMasListSuccess = (s: any) =>
  (s.createItemMasList?.success as boolean) ?? false;
export const selectCreateItemMasListError = (s: any) =>
  (s.createItemMasList?.error as string | null) ?? null;
export const selectCreatedItemMasList = (s: any) =>
  (s.createItemMasList?.createdItems as ItemMasListItem[]) ?? [];