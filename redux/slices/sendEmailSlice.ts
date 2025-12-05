import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface SendEmailPayload {
  toEmail: string;
  subject: string;
  body: string;
  isHtml: boolean;
  ccEmails?: string;
  bccEmails?: string;
  replyToEmail?: string;
  priority?: number;
  senderName?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  timestamp?: string;
}

export interface SendEmailState {
  loading: boolean;
  error: string | null;
  success: boolean;
  response: SendEmailResponse | null;
}

const initialState: SendEmailState = {
  loading: false,
  error: null,
  success: false,
  response: null,
};

/** ---- Thunk: POST /send ---- */
export const sendEmail = createAsyncThunk<
  SendEmailResponse,
  SendEmailPayload,
  { rejectValue: string }
>("email/send", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/send`;
    const res = await axios.post(url, payload);
    return res.data as SendEmailResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to send email.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const sendEmailSlice = createSlice({
  name: "sendEmail",
  initialState,
  reducers: {
    clearSendEmail(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
    },
    resetSendEmailState(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        sendEmail.fulfilled,
        (state, action: PayloadAction<SendEmailResponse>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(sendEmail.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to send email.";
      });
  },
});

export const { clearSendEmail, resetSendEmailState } = sendEmailSlice.actions;
export default sendEmailSlice.reducer;

/** ---- Selectors ---- */
export const selectSendEmailLoading = (s: any) =>
  (s.sendEmail?.loading as boolean) ?? false;

export const selectSendEmailError = (s: any) =>
  (s.sendEmail?.error as string | null) ?? null;

export const selectSendEmailSuccess = (s: any) =>
  (s.sendEmail?.success as boolean) ?? false;

export const selectSendEmailResponse = (s: any) =>
  s.sendEmail?.response ?? null;

export const selectEmailMessageId = (s: any) =>
  s.sendEmail?.response?.messageId ?? null;