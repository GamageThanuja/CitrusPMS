import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Item {
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
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

interface ItemMasterState {
  response: any;
  loading: boolean;
  error: string | null;
}

const initialState: ItemMasterState = {
  response: null,
  loading: false,
  error: null,
};

// ⬇️ POST list of items
export const postItemMasterList = createAsyncThunk(
  "itemMaster/postList",
  async (items: Item[], { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/ItemMaster/list`,
        items,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Post failed");
    }
  }
);

const itemMasterSlice = createSlice({
  name: "itemMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(postItemMasterList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postItemMasterList.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
      })
      .addCase(postItemMasterList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default itemMasterSlice.reducer;
