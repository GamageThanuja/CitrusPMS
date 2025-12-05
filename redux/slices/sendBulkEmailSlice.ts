import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SendBulkEmailPayload {
  toEmails: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  ccEmails?: string;
  bccEmails?: string;
  replyToEmail?: string;
  priority?: number;
  senderName?: string;
  sendIndividually: boolean;
}

export interface BulkEmailRecipientStatus {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendBulkEmailResponse {
  success: boolean;
  message: string;
  totalRecipients: number;
  successful: number;
  failed: number;
  recipients: BulkEmailRecipientStatus[];
  timestamp?: string;
}

export interface SendBulkEmailState {
  loading: boolean;
  error: string | null;
  success: boolean;
  response: SendBulkEmailResponse | null;
  progress?: {
    current: number;
    total: number;
  };
}

const initialState: SendBulkEmailState = {
  loading: false,
  error: null,
  success: false,
  response: null,
  progress: undefined,
};

/** ---- Thunk: POST /send-bulk ---- */
export const sendBulkEmail = createAsyncThunk<
  SendBulkEmailResponse,
  SendBulkEmailPayload,
  { rejectValue: string }
>("email/sendBulk", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/send-bulk`;
    const res = await axios.post(url, payload);
    return res.data as SendBulkEmailResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to send bulk email.";
    return rejectWithValue(msg);
  }
});

/** ---- Enhanced Thunk with Progress Tracking ---- */
export const sendBulkEmailWithProgress = createAsyncThunk<
  SendBulkEmailResponse,
  SendBulkEmailPayload,
  { rejectValue: string }
>("email/sendBulkWithProgress", async (payload, { dispatch, rejectWithValue }) => {
  try {
    // Optional: If you want to simulate progress for bulk sending
    // You can dispatch progress updates if your API supports it
    // This is a placeholder for actual progress tracking implementation
    const url = `${API_BASE_URL}/send-bulk`;
    const res = await axios.post(url, payload);
    return res.data as SendBulkEmailResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to send bulk email.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const sendBulkEmailSlice = createSlice({
  name: "sendBulkEmail",
  initialState,
  reducers: {
    clearSendBulkEmail(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
      state.progress = undefined;
    },
    resetSendBulkEmailState(state) {
      Object.assign(state, initialState);
    },
    updateBulkEmailProgress(
      state,
      action: PayloadAction<{ current: number; total: number }>
    ) {
      state.progress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendBulkEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.progress = { current: 0, total: 0 };
      })
      .addCase(
        sendBulkEmail.fulfilled,
        (state, action: PayloadAction<SendBulkEmailResponse>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
          state.progress = {
            current: action.payload.totalRecipients,
            total: action.payload.totalRecipients,
          };
        }
      )
      .addCase(sendBulkEmail.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to send bulk email.";
        state.progress = undefined;
      })
      .addCase(sendBulkEmailWithProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.progress = { current: 0, total: 0 };
      })
      .addCase(
        sendBulkEmailWithProgress.fulfilled,
        (state, action: PayloadAction<SendBulkEmailResponse>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
          state.progress = {
            current: action.payload.totalRecipients,
            total: action.payload.totalRecipients,
          };
        }
      )
      .addCase(sendBulkEmailWithProgress.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to send bulk email.";
        state.progress = undefined;
      });
  },
});

export const { 
  clearSendBulkEmail, 
  resetSendBulkEmailState, 
  updateBulkEmailProgress 
} = sendBulkEmailSlice.actions;
export default sendBulkEmailSlice.reducer;

/** ---- Selectors ---- */
export const selectSendBulkEmailLoading = (s: any) =>
  (s.sendBulkEmail?.loading as boolean) ?? false;

export const selectSendBulkEmailError = (s: any) =>
  (s.sendBulkEmail?.error as string | null) ?? null;

export const selectSendBulkEmailSuccess = (s: any) =>
  (s.sendBulkEmail?.success as boolean) ?? false;

export const selectSendBulkEmailResponse = (s: any) =>
  s.sendBulkEmail?.response ?? null;

export const selectBulkEmailProgress = (s: any) =>
  s.sendBulkEmail?.progress ?? null;

export const selectBulkEmailTotalRecipients = (s: any) =>
  s.sendBulkEmail?.response?.totalRecipients ?? 0;

export const selectBulkEmailSuccessfulCount = (s: any) =>
  s.sendBulkEmail?.response?.successful ?? 0;

export const selectBulkEmailFailedCount = (s: any) =>
  s.sendBulkEmail?.response?.failed ?? 0;

export const selectBulkEmailRecipients = (s: any) =>
  s.sendBulkEmail?.response?.recipients ?? [];

export const selectFailedRecipients = (s: any) =>
  (s.sendBulkEmail?.response?.recipients ?? []).filter(
    (r: BulkEmailRecipientStatus) => !r.success
  );

export const selectSuccessfulRecipients = (s: any) =>
  (s.sendBulkEmail?.response?.recipients ?? []).filter(
    (r: BulkEmailRecipientStatus) => r.success
  );

export const selectProgressPercentage = (s: any) => {
  const progress = s.sendBulkEmail?.progress;
  if (!progress || progress.total === 0) return 0;
  return Math.round((progress.current / progress.total) * 100);
};