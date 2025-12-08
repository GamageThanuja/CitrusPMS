import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SendSimpleEmailQueryParams {
  toEmail: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface SendSimpleEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  timestamp?: string;
}

export interface SendSimpleEmailState {
  loading: boolean;
  error: string | null;
  success: boolean;
  response: SendSimpleEmailResponse | null;
}

const initialState: SendSimpleEmailState = {
  loading: false,
  error: null,
  success: false,
  response: null,
};

/** ---- Thunk: POST /send-simple ---- */
export const sendSimpleEmail = createAsyncThunk<
  SendSimpleEmailResponse,
  SendSimpleEmailQueryParams,
  { rejectValue: string }
>("email/sendSimple", async (queryParams, { rejectWithValue }) => {
  try {
    // Build query string from parameters
    const queryString = new URLSearchParams({
      toEmail: queryParams.toEmail,
      subject: queryParams.subject,
      body: queryParams.body,
      isHtml: queryParams.isHtml?.toString() || "true",
    }).toString();

    const url = `${API_BASE_URL}/send-simple?${queryString}`;
    const res = await axios.post(url); // No request body for simple endpoint
    return res.data as SendSimpleEmailResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to send simple email.";
    return rejectWithValue(msg);
  }
});

/** ---- Alternative approach if you prefer to send as request body ---- */
export const sendSimpleEmailAsBody = createAsyncThunk<
  SendSimpleEmailResponse,
  SendSimpleEmailQueryParams,
  { rejectValue: string }
>("email/sendSimpleBody", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/send-simple`;
    // Convert query params to request body if API supports it
    const res = await axios.post(url, payload);
    return res.data as SendSimpleEmailResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to send simple email.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const sendSimpleEmailSlice = createSlice({
  name: "sendSimpleEmail",
  initialState,
  reducers: {
    clearSendSimpleEmail(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
    },
    resetSendSimpleEmailState(state) {
      Object.assign(state, initialState);
    },
    // Optional: Quick action for sending with minimal parameters
    prepareSendSimpleEmail(
      _state,
      _action: PayloadAction<{
        toEmail: string;
        subject: string;
        body: string;
        isHtml?: boolean;
      }>
    ) {
      // This reducer can be used to prepare data before sending
      // It doesn't modify state, just prepares the payload
    },
  },
  extraReducers: (builder) => {
    // Handle both thunks in the same slice
    builder
      // For sendSimpleEmail (query params)
      .addCase(sendSimpleEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        sendSimpleEmail.fulfilled,
        (state, action: PayloadAction<SendSimpleEmailResponse>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(sendSimpleEmail.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to send simple email.";
      })
      // For sendSimpleEmailAsBody (request body)
      .addCase(sendSimpleEmailAsBody.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        sendSimpleEmailAsBody.fulfilled,
        (state, action: PayloadAction<SendSimpleEmailResponse>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(sendSimpleEmailAsBody.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to send simple email.";
      });
  },
});

export const { 
  clearSendSimpleEmail, 
  resetSendSimpleEmailState,
  prepareSendSimpleEmail 
} = sendSimpleEmailSlice.actions;
export default sendSimpleEmailSlice.reducer;

/** ---- Selectors ---- */
export const selectSendSimpleEmailLoading = (s: any) =>
  (s.sendSimpleEmail?.loading as boolean) ?? false;

export const selectSendSimpleEmailError = (s: any) =>
  (s.sendSimpleEmail?.error as string | null) ?? null;

export const selectSendSimpleEmailSuccess = (s: any) =>
  (s.sendSimpleEmail?.success as boolean) ?? false;

export const selectSendSimpleEmailResponse = (s: any) =>
  s.sendSimpleEmail?.response ?? null;

export const selectSimpleEmailMessageId = (s: any) =>
  s.sendSimpleEmail?.response?.messageId ?? null;

/** ---- Helper Functions ---- */
export const validateSimpleEmailParams = (
  params: Partial<SendSimpleEmailQueryParams>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!params.toEmail?.trim()) {
    errors.push("Recipient email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.toEmail)) {
    errors.push("Invalid recipient email format");
  }

  if (!params.subject?.trim()) {
    errors.push("Subject is required");
  } else if (params.subject.length > 200) {
    errors.push("Subject is too long (max 200 characters)");
  }

  if (!params.body?.trim()) {
    errors.push("Body is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/** ---- Quick Action Creators ---- */
export const createQuickSimpleEmail = (
  toEmail: string,
  subject: string,
  body: string,
  isHtml: boolean = true
): SendSimpleEmailQueryParams => ({
  toEmail,
  subject,
  body,
  isHtml,
});

// Optional: If you want to use a hook pattern
export const useSimpleEmail = () => {
  // This would typically be used in a custom hook component
  // For demonstration purposes only
  return {
    send: sendSimpleEmail,
    clear: clearSendSimpleEmail,
    selectors: {
      loading: selectSendSimpleEmailLoading,
      error: selectSendSimpleEmailError,
      success: selectSendSimpleEmailSuccess,
      response: selectSendSimpleEmailResponse,
    },
  };
};