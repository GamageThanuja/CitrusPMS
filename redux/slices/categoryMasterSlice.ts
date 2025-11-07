import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define the Category interface
interface Category {
  categoryID: number;
  hotelID: number;
  categoryName: string;
  finAct: boolean;
}

// Define the state
interface CategoryState {
  response: any;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  response: null,
  loading: false,
  error: null,
};

// Create async thunk for posting category list
export const postCategoryList = createAsyncThunk(
  "categoryMaster/postList",
  async (categories: Category[], { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/CategoryMaster/create-category-list`,
        categories,
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

// Create slice
const categoryMasterSlice = createSlice({
  name: "categoryMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(postCategoryList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postCategoryList.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
      })
      .addCase(postCategoryList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default categoryMasterSlice.reducer;
