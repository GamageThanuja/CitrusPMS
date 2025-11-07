import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ApiCategory {
  categoryID: number;
  hotelID: number;
  categoryName: string;
  finAct: boolean;
}

export interface Category {
  id: string;
  name: string;
}

interface CategoryState {
  categories: Category[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  status: "idle",
  error: null,
};

export const fetchCategories = createAsyncThunk<
  ApiCategory[],
  void,
  { rejectValue: string }
>("categories/fetchCategories", async (_: void, { rejectWithValue }) => {
  try {
    const tokensRaw = localStorage.getItem("hotelmateTokens");
    const tokens = tokensRaw ? JSON.parse(tokensRaw) : {};
    const accessToken: string | undefined = tokens?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: number | undefined = property?.id;

    if (!accessToken) return rejectWithValue("Missing access token");
    if (!hotelId) return rejectWithValue("Missing hotelId");

    const res = await fetch(
      `${BASE_URL}/api/CategoryMaster/get-all-categories?hotelId=${hotelId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to fetch categories");
    }

    const data: ApiCategory[] = await res.json();
    return data;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? "Unknown error");
  }
});

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categories = action.payload.map((cat) => ({
          id: String(cat.categoryID),
          name: cat.categoryName,
        }));
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Failed to load categories";
      });
  },
});

export default categorySlice.reducer;
