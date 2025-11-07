// src/redux/slices/hotelImageUploadSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type HotelImageUploadPayload = {
  imageID?: number;
  hotelID?: number;
  imageFileName: string;
  description?: string;
  isMain?: boolean;
  finAct?: boolean;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  base64Image: string; // base64 encoded image string
  bucketName?: string;
};

type HotelImageUploadState = {
  loading: boolean;
  error: string | null;
  success: boolean;
  uploadedImage?: any;
};

const initialState: HotelImageUploadState = {
  loading: false,
  error: null,
  success: false,
};

// Async thunk
export const uploadHotelImage = createAsyncThunk<
  any,
  HotelImageUploadPayload,
  { rejectValue: string }
>("hotelImageUpload/uploadHotelImage", async (payload, { rejectWithValue }) => {
  try {
    // tokens
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    // hotelId from selected property
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    const body = {
      ...payload,
      hotelID: hotelId,
      createdOn: new Date().toISOString(),
      updatedOn: new Date().toISOString(),
    };

    const response = await axios.post(
      `${BASE_URL}/api/HotelImage/file-upload`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.detail ||
        err.message ||
        "Failed to upload hotel image"
    );
  }
});

const hotelImageUploadSlice = createSlice({
  name: "hotelImageUpload",
  initialState,
  reducers: {
    clearHotelImageUploadState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.uploadedImage = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadHotelImage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        uploadHotelImage.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.uploadedImage = action.payload;
        }
      )
      .addCase(uploadHotelImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Upload failed";
        state.success = false;
      });
  },
});

export const { clearHotelImageUploadState } = hotelImageUploadSlice.actions;
export default hotelImageUploadSlice.reducer;
