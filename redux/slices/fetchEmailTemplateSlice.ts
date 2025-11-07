import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const fetchEmailTemplates = createAsyncThunk(
  "emailTemplate/fetchEmailTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const tokenStr =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      let token = "";
      if (tokenStr) {
        try {
          token = JSON.parse(tokenStr)?.accessToken || "";
        } catch {
          token = "";
        }
      }
      const response = await axios.get(`${BASE_URL}/api/EmailTemplate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch email templates"
      );
    }
  }
);

type EmailTemplateState = {
  data: any[];
  loading: boolean;
  error: null | string;
};

const initialState: EmailTemplateState = {
  data: [],
  loading: false,
  error: null,
};

const emailTemplateSlice = createSlice({
  name: "emailTemplate",
  initialState,
  reducers: {
    resetEmailTemplateState: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch email templates";
      });
  },
});

export const { resetEmailTemplateState } = emailTemplateSlice.actions;
export default emailTemplateSlice.reducer;
