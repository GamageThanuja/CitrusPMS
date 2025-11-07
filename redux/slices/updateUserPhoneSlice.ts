// redux/slices/updateUserPhoneSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

type UpdateUserPhonePayload = {
  email: string;
  phoneNumber: string;
};

type ApiSuccess = {
  message: string; // "Password updated successfully." per docs text (we'll normalize)
  statusCode?: number;
};

type ApiError = {
  status: number;
  title?: string;
  detail?: string;
  type?: string;
  instance?: string;
};

type UpdateUserPhoneState = {
  loading: boolean;
  success: boolean;
  data: ApiSuccess | null;
  error: string | null;
};

const initialState: UpdateUserPhoneState = {
  loading: false,
  success: false,
  data: null,
  error: null,
};

// Adjust this to your environment setup
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""; // e.g. "https://api.gramaniladari.click"

export const updateUserPhone = createAsyncThunk<
  ApiSuccess,
  UpdateUserPhonePayload,
  { rejectValue: ApiError | { status: number; detail: string } }
>("user/updateUserPhone", async (payload, { rejectWithValue }) => {
  try {
    // Tokens & hotel from localStorage (as requested)
    const storedToken = localStorage.getItem("hotelmateTokens");
    const parsedToken = storedToken ? JSON.parse(storedToken) : null;
    const accessToken: string | undefined = parsedToken?.accessToken;

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId: string | undefined = property?.id;

    const url = `${API_BASE}/api/SignUp/update-user-phone`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    // Optional: send hotelId for multi-property context if your API expects it
    if (hotelId) headers["x-hotel-id"] = String(hotelId);

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: payload.email,
        phoneNumber: payload.phoneNumber,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    const tryJson = contentType.includes("application/json")
      ? await res.json().catch(() => ({}))
      : null;
    const text = !tryJson ? await res.text().catch(() => "") : "";

    if (!res.ok) {
      // Map error shape from your swagger examples (400/404/500 return text/plain with a JSON-like schema)
      const detail =
        (tryJson && (tryJson.detail || tryJson.title)) ||
        text ||
        `Request failed with status ${res.status}`;
      return rejectWithValue({
        status: res.status,
        title: tryJson?.title,
        detail,
        type: tryJson?.type,
        instance: tryJson?.instance,
      });
    }

    // Success (200): swagger says "Password updated successfully." (text/plain)
    const message =
      (tryJson &&
        (tryJson.message || tryJson.title || "Phone updated successfully.")) ||
      text ||
      "Phone updated successfully.";

    return { message, statusCode: res.status };
  } catch (err: any) {
    return rejectWithValue({
      status: 0,
      detail: err?.message ?? "Network or unexpected error",
    });
  }
});

const slice = createSlice({
  name: "updateUserPhone",
  initialState,
  reducers: {
    resetUpdateUserPhoneState: (state) => {
      state.loading = false;
      state.success = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUserPhone.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.data = null;
        state.error = null;
      })
      .addCase(
        updateUserPhone.fulfilled,
        (state, action: PayloadAction<ApiSuccess>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(updateUserPhone.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        const payload = action.payload as
          | ApiError
          | { status: number; detail: string }
          | undefined;
        state.error =
          payload?.detail ||
          (typeof action.error.message === "string"
            ? action.error.message
            : "Request failed");
      });
  },
});

export const { resetUpdateUserPhoneState } = slice.actions;
export default slice.reducer;

// Selectors
export const selectUpdateUserPhoneLoading = (s: any) =>
  s.updateUserPhone.loading as boolean;
export const selectUpdateUserPhoneSuccess = (s: any) =>
  s.updateUserPhone.success as boolean;
export const selectUpdateUserPhoneError = (s: any) =>
  s.updateUserPhone.error as string | null;
export const selectUpdateUserPhoneData = (s: any) =>
  s.updateUserPhone.data as ApiSuccess | null;
