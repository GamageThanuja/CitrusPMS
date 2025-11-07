// @ts-nocheck
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type UpdatePasswordPayload = {
  email: string;
  oldPassword: string;
  newPassword: string;
};

type UpdatePasswordState = {
  loading: boolean;
  success: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
};

const initialState: UpdatePasswordState = {
  loading: false,
  success: false,
  error: null,
  lastUpdatedAt: null,
};

function getAuthBits() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId = property?.id;

  return { accessToken, hotelId };
}

export const updatePassword = createAsyncThunk<
  // Return type of the payload creator
  any,
  // First argument to the payload creator
  UpdatePasswordPayload,
  {
    rejectValue: { message: string; status?: number; details?: any };
  }
>("auth/updatePassword", async (body, { rejectWithValue }) => {
  try {
    const { accessToken, hotelId } = getAuthBits();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    // If your API expects a hotel header, uncomment and adjust:
    // if (hotelId) headers["Hotel-Id"] = String(hotelId);

    const res = await fetch(`${BASE_URL}/api/SignUp/update-password`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // Try to parse json (even for error responses that send text/plain sometimes)
    let data: any = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text || null;
    }

    if (!res.ok) {
      return rejectWithValue({
        message:
          (data && (data.detail || data.title || data.message)) ||
          `Request failed (${res.status})`,
        status: res.status,
        details: data,
      });
    }

    return data ?? { ok: true };
  } catch (err: any) {
    return rejectWithValue({
      message: err?.message || "Network error",
    });
  }
});

const updatePasswordSlice = createSlice({
  name: "updatePassword",
  initialState,
  reducers: {
    resetUpdatePasswordState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          action.payload?.message ||
          (action.error?.message ?? "Unknown error occurred");
      });
  },
});

export const { resetUpdatePasswordState } = updatePasswordSlice.actions;

// Selectors
export const selectUpdatePasswordLoading = (s: any) =>
  s.updatePassword?.loading;
export const selectUpdatePasswordSuccess = (s: any) =>
  s.updatePassword?.success;
export const selectUpdatePasswordError = (s: any) => s.updatePassword?.error;
export const selectUpdatePasswordLastUpdated = (s: any) =>
  s.updatePassword?.lastUpdatedAt;

export default updatePasswordSlice.reducer;
