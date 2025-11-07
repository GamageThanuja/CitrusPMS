// src/redux/slices/createBusinessBlockSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiOk = {
  success: boolean;
  message: string;
  reservationNo: string;
  reservationID: number;
};

type ApiErr = { status: number; detail?: string; raw?: string };

export interface CreateBusinessBlockState {
  loading: boolean;
  data: ApiOk | null;
  error: string | null;
}

const initialState: CreateBusinessBlockState = {
  loading: false,
  data: null,
  error: null,
};

function getAuthAndHotel() {
  if (typeof window === "undefined")
    return {
      accessToken: null as string | null,
      hotelId: undefined as number | undefined,
    };
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | null = parsedToken?.accessToken ?? null;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId: number | undefined = property?.id;

  return { accessToken, hotelId };
}

export type CreateBusinessBlockArgs = {
  /** Full request body to send (usually the object you showed in your example) */
  body: any;
  /** Optional: pass true to enable debug logging on the API (adds ?isDebug=true) */
  isDebug?: boolean;
};

export const createBusinessBlock = createAsyncThunk<
  ApiOk,
  CreateBusinessBlockArgs,
  { rejectValue: ApiErr }
>(
  "businessBlock/create",
  async ({ body, isDebug = false }, { rejectWithValue }) => {
    const { accessToken, hotelId } = getAuthAndHotel();

    // Best-effort: inject hotelId into payload if caller didn’t set it
    try {
      if (hotelId && body?.data?.[0]?.attributes) {
        body.data[0].attributes.hotel_id ??= hotelId;
      }
      if (hotelId && body?.data?.[0]?.relationships?.data?.property) {
        body.data[0].relationships.data.property.id ??= String(hotelId);
      }
    } catch {
      // ignore if structure differs; we’ll just post as-is
    }

    const query = new URLSearchParams();
    query.set("isDebug", String(!!isDebug));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch(
      `${BASE_URL}/api/Reservation/business-block?${query.toString()}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      let detail: string | undefined;
      let raw: string | undefined;

      try {
        if (contentType.includes("application/json")) {
          const j = await res.json();
          detail = j?.detail || j?.message || JSON.stringify(j);
        } else {
          raw = await res.text();
          detail = raw;
        }
      } catch {
        // swallow parse errors
      }

      return rejectWithValue({ status: res.status, detail, raw });
    }

    // success path
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as ApiOk;
      return json;
    }

    // Some backends return text/plain but still mean success; normalize it.
    const txt = await res.text();
    // light heuristic: try to parse if it looks like JSON
    try {
      const maybeJson = JSON.parse(txt);
      return maybeJson as ApiOk;
    } catch {
      // fallback: wrap as Ok with message only
      return {
        success: true,
        message: txt || "OK",
        reservationNo: "",
        reservationID: 0,
      };
    }
  }
);

const createBusinessBlockSlice = createSlice({
  name: "createBusinessBlock",
  initialState,
  reducers: {
    resetCreateBusinessBlockState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBusinessBlock.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(
        createBusinessBlock.fulfilled,
        (state, action: PayloadAction<ApiOk>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(createBusinessBlock.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as ApiErr)?.detail ||
          (action.error?.message ?? "Failed to create business block");
      });
  },
});

export const { resetCreateBusinessBlockState } =
  createBusinessBlockSlice.actions;
export default createBusinessBlockSlice.reducer;

/** Optional helpers */
export const selectCreateBusinessBlock = (s: any) =>
  s.createBusinessBlock as CreateBusinessBlockState;
export const selectCreateBusinessBlockLoading = (s: any) =>
  (s.createBusinessBlock as CreateBusinessBlockState).loading;
export const selectCreateBusinessBlockError = (s: any) =>
  (s.createBusinessBlock as CreateBusinessBlockState).error;
export const selectCreateBusinessBlockData = (s: any) =>
  (s.createBusinessBlock as CreateBusinessBlockState).data;
