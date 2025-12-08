// src/redux/slices/emailSendSlice.ts
// @ts-nocheck
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
/** ----- Types ----- */
export interface EmailRequest {
  toEmail: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  ccEmails?: string; // comma-separated per API
  bccEmails?: string; // comma-separated per API
  replyToEmail?: string;
  priority?: number; // 0=Normal (example)
  senderName?: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  emailId?: string;
  sentAt?: string;
  toEmail?: string;
  subject?: string;
  errorDetails?: string;
}

interface EmailSendState {
  loading: boolean;
  error: string | null;
  lastResponse: EmailResponse | null;
}

/** ----- Initial State ----- */
const initialState: EmailSendState = {
  loading: false,
  error: null,
  lastResponse: null,
};

/** ----- Thunk ----- */
export const sendCustomEmail = createAsyncThunk<
  EmailResponse, // return type
  EmailRequest, // arg type
  { rejectValue: string } // reject type
>(
  "email/sendCustomEmail",
  async (payload: EmailRequest, { rejectWithValue }) => {
    try {
      // Read tokens & property INSIDE the thunk (client-only)
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsedToken?.accessToken;

      const selectedProperty =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedProperty")
          : null;
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const hotelId = property?.id;

      if (!accessToken) {
        return rejectWithValue("No access token found. Please sign in again.");
      }

      // Some backends require hotel context; if yours needs it, we pass it as a query param.
      // If not required, you can remove the `?hotelId=` part safely.
      const url = `${API_BASE_URL}send${
        hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ""
      }`;

      const res = await axios.post<EmailResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return res.data;
    } catch (err: any) {
      // Normalize error message
      const msg =
        err?.response?.data?.errorDetails ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send email.";
      return rejectWithValue(msg);
    }
  }
);

/** ----- Slice ----- */
const emailSendSlice = createSlice({
  name: "emailSend",
  initialState,
  reducers: {
    clearEmailError(state) {
      state.error = null;
    },
    resetEmailState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendCustomEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        sendCustomEmail.fulfilled,
        (state, action: PayloadAction<EmailResponse>) => {
          state.loading = false;
          state.lastResponse = action.payload;
        }
      )
      .addCase(sendCustomEmail.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to send email.";
      });
  },
});

export const { clearEmailError, resetEmailState } = emailSendSlice.actions;
export default emailSendSlice.reducer;

/** ----- Selectors ----- */
export const selectEmailSending = (s: any) => s.emailSend.loading;
export const selectEmailError = (s: any) => s.emailSend.error;
export const selectEmailLastResponse = (s: any) => s.emailSend.lastResponse;
