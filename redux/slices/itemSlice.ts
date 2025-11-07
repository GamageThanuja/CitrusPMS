// redux/slices/itemSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchItems = createAsyncThunk(
  "items/fetchItems",
  async (hotelID: number, { getState, rejectWithValue }) => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens.accessToken;

    try {
      const response = await fetch(
        `${BASE_URL}/api/ItemMaster/hotel/${hotelID}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.itemID,
        itemID: item.itemID,
        name: item.itemName,
        price: item.price,
        category: item.categoryID, // be sure your API returns this
        description: item.description,
        imageUrl: item.imageURL,
        itemCode: item.itemCode,
        salesAccountID: item.salesAccountID,
      }));
    } catch (err) {
      return rejectWithValue("Failed to fetch items");
    }
  }
);

const itemSlice = createSlice({
  name: "items",
  initialState: {
    items: [] as Item[],
    status: "idle",
    error: null as string | null,
  },
  reducers: {
    addItem(state, action) {
      state.items.push(action.payload);
    },
    deleteItem(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    // optionally add updateItem if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { addItem, deleteItem } = itemSlice.actions;
export default itemSlice.reducer;
