// store/slices/checkInSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const checkInReservation = createAsyncThunk(
  "reservation/checkInReservation",
  async (
    {
      reservationDetailId,
      payload,
    }: {
      reservationDetailId: number;
      payload: {
        reservationDetailId: number;
        reservationStatusId: number;
        checkINat: string;
        checkedInBy: string;
        guestProfileId: number;
        isRepeatGuest: boolean;
      };
    },
    { rejectWithValue }
  ) => {
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsed = storedToken ? JSON.parse(storedToken) : null;
    const accessToken = parsed?.accessToken;

    if (!accessToken) return rejectWithValue("No access token");

    try {
      const response = await fetch(
        `${BASE_URL}/api/Reservation/CheckIn/${reservationDetailId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Check-in failed");
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const checkInSlice = createSlice({
  name: "checkIn",
  initialState: {
    loading: false,
    error: null as string | null,
    result: null as any,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkInReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.result = null;
      })
      .addCase(checkInReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(checkInReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default checkInSlice.reducer;
