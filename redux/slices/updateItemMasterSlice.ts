// src/redux/slices/updateItemMasterSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type { RootState } from "../store";

// ---- Types ----
export interface ItemMaster {
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
  createdBy: string;
  createdOn: string; // ISO string
  updatedBy: string;
  updatedOn: string; // ISO string
}

type UpdateItemMasterArgs = {
  id: number; // path param
  data: Partial<ItemMaster> & {
    itemName: string; // usually required by your API – keep what you need
    itemCode: string;
    price: number;
  };
};

type Status = "idle" | "loading" | "succeeded" | "failed";

interface UpdateItemMasterState {
  status: Status;
  error: string | null;
  item: ItemMaster | null;
}

// ---- Initial ----
const initialState: UpdateItemMasterState = {
  status: "idle",
  error: null,
  item: null,
};

// Prefer env; fallback to prod API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
// ---- Thunk ----
export const updateItemMaster = createAsyncThunk<
  ItemMaster,
  UpdateItemMasterArgs,
  { rejectValue: string }
>("itemMaster/update", async ({ id, data }, thunkAPI) => {
  try {
    // tokens & property
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;

    if (!accessToken) {
      return thunkAPI.rejectWithValue("No access token in localStorage.");
    }
    if (!hotelId) {
      return thunkAPI.rejectWithValue("No selected hotel found.");
    }

    // Auto-fill/ensure fields required by your API
    const body: ItemMaster = {
      categoryID: data.categoryID ?? 0,
      itemID: data.itemID ?? id,
      hotelID: data.hotelID ?? hotelId,
      itemCode: data.itemCode ?? "",
      itemName: data.itemName ?? "",
      description: data.description ?? "",
      salesAccountID: data.salesAccountID ?? 0,
      price: data.price ?? 0,
      imageURL: data.imageURL ?? "",
      finAct: data.finAct ?? true,
      createdBy: data.createdBy ?? "",
      createdOn: data.createdOn ?? new Date().toISOString(), // send something if backend expects it
      updatedBy: data.updatedBy ?? "system",
      updatedOn: new Date().toISOString(),
    };

    const res = await axios.put<ItemMaster>(
      `${API_BASE}/api/ItemMaster/${id}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "text/plain, application/json",
        },
      }
    );

    // Some .NET APIs return text/plain with JSON string; handle both
    const payload =
      typeof res.data === "string"
        ? (JSON.parse(res.data) as ItemMaster)
        : res.data;

    return payload;
  } catch (err: any) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.title ||
      err?.message ||
      "Failed to update item.";
    return thunkAPI.rejectWithValue(msg);
  }
});

// ---- Slice ----
const updateItemMasterSlice = createSlice({
  name: "updateItemMaster",
  initialState,
  reducers: {
    resetUpdateItemMaster(state) {
      state.status = "idle";
      state.error = null;
      state.item = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateItemMaster.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updateItemMaster.fulfilled,
        (state, action: PayloadAction<ItemMaster>) => {
          state.status = "succeeded";
          state.item = action.payload;
        }
      )
      .addCase(updateItemMaster.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Update failed.";
      });
  },
});

export const { resetUpdateItemMaster } = updateItemMasterSlice.actions;
export default updateItemMasterSlice.reducer;

// ---- Selectors ----
export const selectUpdateItemStatus = (s: RootState) =>
  s.updateItemMaster.status;
export const selectUpdateItemError = (s: RootState) => s.updateItemMaster.error;
export const selectUpdatedItem = (s: RootState) => s.updateItemMaster.item;
