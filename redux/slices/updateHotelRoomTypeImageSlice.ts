// src/redux/slices/updateHotelRoomTypeImageSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// src/redux/slices/updateHotelRoomTypeImageSlice.js
export const updateHotelRoomTypeImage = createAsyncThunk(
  "hotelRoomTypeImage/update",
  async (
    { id, imageData }, // <-- accept imageData (matches your dispatch)
    { rejectWithValue }
  ) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property.id;

      const payload = { ...(imageData || {}), hotelID: hotelId }; // <-- guard
      const endpoint = `${BASE_URL}/api/HotelRoomTypeImage/${id}`;

      console.log("[updateHotelRoomTypeImage] ➡️ Request", {
        endpoint,
        method: "PUT",
        payload,
      });

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let body;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = raw;
      }

      console.log("[updateHotelRoomTypeImage] ⬅️ Response", {
        ok: response.ok,
        status: response.status,
        body,
      });

      if (!response.ok) {
        return rejectWithValue(
          body || { message: "Failed to update image", status: response.status }
        );
      }
      return body;
    } catch (error) {
      console.error("[updateHotelRoomTypeImage] ❌ Error", error);
      return rejectWithValue(error?.message || "An unexpected error occurred");
    }
  }
);

const updateHotelRoomTypeImageSlice = createSlice({
  name: "updateHotelRoomTypeImage",
  initialState: {
    loading: false,
    success: false,
    error: null,
    updatedImage: null,
  },
  reducers: {
    resetUpdateState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.updatedImage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelRoomTypeImage.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateHotelRoomTypeImage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.updatedImage = action.payload;
      })
      .addCase(updateHotelRoomTypeImage.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { resetUpdateState } = updateHotelRoomTypeImageSlice.actions;
export default updateHotelRoomTypeImageSlice.reducer;
