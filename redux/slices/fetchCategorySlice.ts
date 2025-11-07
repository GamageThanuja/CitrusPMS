// redux/slices/categorySlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Category {
  categoryID: number;
  hotelID: number;
  categoryName: string;
  finAct: boolean;
}

interface CategoryState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  items: [],
  loading: false,
  error: null,
};

// Async thunk to fetch categories
export const fetchCategories = createAsyncThunk<Category[]>(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      // Tokens
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // Property
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const response = await axios.get<Category[]>(
        `${BASE_URL}/api/CategoryMaster/get-all-categories`,
        {
          params: { hotelId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

const fetchCategorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default fetchCategorySlice.reducer;
