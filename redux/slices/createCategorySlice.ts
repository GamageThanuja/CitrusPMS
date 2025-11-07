// src/redux/slices/createCategorySlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface CategoryPayload {
  categoryID: number;
  hotelID: number;
  categoryName: string;
  finAct: boolean;
  baseCategoryId: number;
  createdOn: string;
  createdBy: string;
}

export interface CreateCategoryState {
  data: CategoryPayload | null;
  loading: boolean;
  error: string | null;
}

const initialState: CreateCategoryState = {
  data: null,
  loading: false,
  error: null,
};

// ✅ async thunk
export const createCategory = createAsyncThunk(
  "createCategory/createCategory",
  async (
    payload: Omit<CategoryPayload, "hotelID" | "categoryID" | "createdOn">,
    { rejectWithValue }
  ) => {
    try {
      // --- Get access token ---
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      // --- Get hotelID from selectedProperty ---
      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property?.id;

      const response = await axios.post(
        `${BASE_URL}/api/CategoryMaster/create-category`,
        {
          categoryID: 0, // new category
          hotelID: hotelId,
          createdOn: new Date().toISOString(),
          ...payload,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data as CategoryPayload;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const createCategorySlice = createSlice({
  name: "createCategory",
  initialState,
  reducers: {
    clearCreateCategoryState: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCreateCategoryState } = createCategorySlice.actions;
export default createCategorySlice.reducer;
