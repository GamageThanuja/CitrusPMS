import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Category {
  categoryID: number;
  hotelID: number;
  categoryName: string;
  finAct: boolean;
  baseCategoryId: number;
  createdOn: string;
  createdBy: string;
}

interface FetchCategoriesState {
  data: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: FetchCategoriesState = {
  data: [],
  loading: false,
  error: null,
};

// Thunk
export const fetchCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>("categories/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!hotelId) {
      return rejectWithValue("No hotel selected.");
    }

    const res = await fetch(
      `${BASE_URL}/api/CategoryMaster/get-all-categories/${hotelId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return rejectWithValue(
        `HTTP ${res.status}: ${errorText || res.statusText}`
      );
    }

    return (await res.json()) as Category[];
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to fetch categories.");
  }
});

// Slice
const fetchCategoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    resetCategoriesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { resetCategoriesState } = fetchCategoriesSlice.actions;
export default fetchCategoriesSlice.reducer;
