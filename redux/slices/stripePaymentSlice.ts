// src/redux/slices/stripePaymentSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type HotelImage = {
  imageID: number;
  hotelID: number;
  imageFileName: string | null;
  description: string | null;
  isMain: boolean;
  finAct: boolean;
  createdOn: string | null;
  createdBy: string | null;
  updatedOn: string | null;
  updatedBy: string | null;
  base64Image: string | null;
  bucketName: string | null;
};

export type Hotel = {
  hotelID: number;
  hotelGUID: string | null;
  finAct: boolean;
  hotelName: string | null;
  hotelCode: number | null;
  userGUID_HotelOwner: string | null;
  hotelType: string | null;
  hotelAddress: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  hotelPhone: string | null;
  hotelEmail: string | null;
  hotelWeb: string | null;
  noOfRooms: number | null;
  latitude: string | null;
  longitude: string | null;
  currencyCode: string | null;
  languageCode: string | null;
  createdOn: string | null;
  createdTimeStamp: string | null;
  lastUpdatedOn: string | null;
  lastUpdatedTimeStamp: string | null;
  lastUpdatedBy_UserGUID: string | null;
  starCatgeory: number | null;
  cM_PropertyID: string | null;
  hotelDesc: string | null;
  isCMActive: boolean;
  isIBEActive: boolean;
  ibE_CancellationPolicy: string | null;
  ibE_ChildPolicy: string | null;
  ibE_TaxPolicy: string | null;
  logoURL: string | null;
  slug: string | null;
  hotelDate: string | null;
  isOnTrial: boolean;
  ibeHeaderColour: string | null;
  grC_Para1: string | null;
  proforma_Terms: string | null;
  grC_Para3: string | null;
  bankName: string | null;
  bankBranch: string | null;
  accountName: string | null;
  accountNo: string | null;
  swiftCode: string | null;
  deactivatedBy: string | null;
  deactivatedTimeStamp: string | null;
  planId: number | null;
  stripePaymentRef: string | null;
  isPaymentTrue: boolean;
  stripeAuthCode: string | null;
  authTimeStamp: string | null;
  hotelImage?: HotelImage | null;
  lowestRate?: number | null;
};

type StripePaymentPayload = {
  hotelId?: number; // optional override
  stripePaymentRef: string;
  isPaymentTrue: boolean;
  stripeAuthCode?: string | null;
  authTimeStamp?: string | Date; // ISO string or Date; defaults to now
};

type SliceState = {
  loading: boolean;
  error: string | null;
  data: Hotel | null;
};

const initialState: SliceState = {
  loading: false,
  error: null,
  data: null,
};

// Helper to pull token + hotelId from localStorage consistently
function readLocalAuth() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId: number | undefined = property?.id ?? property?.hotelID;

  return { accessToken, hotelId };
}

export const updateHotelStripePayment = createAsyncThunk<
  Hotel,
  StripePaymentPayload,
  { rejectValue: string }
>("hotel/updateStripePayment", async (payload, { rejectWithValue }) => {
  try {
    const { accessToken, hotelId: storedHotelId } = readLocalAuth();

    const hotelId = payload.hotelId ?? storedHotelId;
    if (!hotelId) return rejectWithValue("Hotel ID not found.");
    if (!accessToken) return rejectWithValue("Access token not found.");

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

    const body = {
      stripePaymentRef: payload.stripePaymentRef,
      isPaymentTrue: payload.isPaymentTrue,
      stripeAuthCode: payload.stripeAuthCode ?? null,
      authTimeStamp: payload.authTimeStamp
        ? typeof payload.authTimeStamp === "string"
          ? payload.authTimeStamp
          : payload.authTimeStamp.toISOString()
        : new Date().toISOString(),
    };

    const res = await fetch(`${apiBase}/api/Hotel/${hotelId}/stripe-payment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, text/plain",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let reason = text;
      // Try parse RFC7807 problem+json if backend returns it
      try {
        const problem = JSON.parse(text);
        reason =
          problem?.detail || problem?.title || text || `HTTP ${res.status}`;
      } catch {
        // ignore JSON parse error; keep raw text
      }
      return rejectWithValue(
        `Failed to update Stripe payment (HTTP ${res.status}). ${reason}`
      );
    }

    const data: Hotel = await res.json();
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err?.message || "Unexpected error calling stripe-payment endpoint."
    );
  }
});

const stripePaymentSlice = createSlice({
  name: "stripePayment",
  initialState,
  reducers: {
    resetStripePaymentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelStripePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateHotelStripePayment.fulfilled,
        (state, action: PayloadAction<Hotel>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        }
      )
      .addCase(updateHotelStripePayment.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Request failed.";
      });
  },
});

export const { resetStripePaymentState } = stripePaymentSlice.actions;
export default stripePaymentSlice.reducer;

// Selectors
export const selectStripePaymentLoading = (s: any) =>
  (s.stripePayment as SliceState).loading;
export const selectStripePaymentError = (s: any) =>
  (s.stripePayment as SliceState).error;
export const selectUpdatedHotel = (s: any) =>
  (s.stripePayment as SliceState).data;
