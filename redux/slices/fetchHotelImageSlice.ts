import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string;
}

interface HotelImageState {
  images: HotelImage[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelImageState = {
  images: [],
  loading: false,
  error: null,
};

// Async thunk to fetch hotel images
export const fetchHotelImagesByHotelId = createAsyncThunk<
  HotelImage[],
  void,
  { rejectValue: string }
>("hotelImages/fetchByHotelId", async (_, { rejectWithValue }) => {
  try {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!accessToken || !hotelId) {
      return rejectWithValue("Missing access token or hotel ID");
    }

    const response = await axios.get(
      `${BASE_URL}/api/HotelImage/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "text/plain",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch hotel images");
  }
});

const fetchHotelImagesSlice = createSlice({
  name: "hotelImages",
  initialState,
  reducers: {
    resetFetchHotelImagesState: (state) => {
      state.images = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelImagesByHotelId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelImagesByHotelId.fulfilled, (state, action) => {
        state.loading = false;
        state.images = action.payload.map((image) => ({
          ...image,
          imageFileName:
            image.imageFileName?.split("?")[0] || image.imageFileName,
        }));
      })
      .addCase(fetchHotelImagesByHotelId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { resetFetchHotelImagesState } = fetchHotelImagesSlice.actions;

export default fetchHotelImagesSlice.reducer;
