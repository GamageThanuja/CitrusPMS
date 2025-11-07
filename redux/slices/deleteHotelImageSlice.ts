// redux/slices/deleteHotelImageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const deleteHotelImage = createAsyncThunk(
  "hotelImage/deleteHotelImage",
  async (id, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;
      if (!accessToken) return rejectWithValue("No access token found");

      const res = await axios.delete(`${BASE_URL}/api/HotelImage/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 204) return id;
      return rejectWithValue("Failed to delete hotel image");
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const deleteHotelImageSlice = createSlice({
  name: "hotelImage",
  initialState: { images: [], loading: false, error: null },
  reducers: {
    setHotelImages: (state, action) => {
      state.images = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteHotelImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHotelImage.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.images = state.images.filter(
          (img) => img.imageID !== deletedId // <-- key fix
        );
      })
      .addCase(deleteHotelImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete hotel image";
      });
  },
});

export const { setHotelImages } = deleteHotelImageSlice.actions;
export default deleteHotelImageSlice.reducer;
