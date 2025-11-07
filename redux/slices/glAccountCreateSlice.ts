// src/redux/slices/glAccountCreateSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

// ---- Types ----------------------------------------------------
export interface GlAccountPayload {
  accountTypeID: number;
  accountCode: string;
  accountName: string;
  description?: string;
  accDetailTypeID: number;
  finAct: boolean;
  // hotelID is injected from localStorage; do NOT pass from UI
}

export interface GlAccountResponse {
  accountID: number;
  accountTypeID: number;
  accountCode: string;
  accountName: string;
  description?: string;
  accDetailTypeID: number;
  finAct: boolean;
  hotelID: string;
}

interface CreateState {
  loading: boolean;
  error: string | null;
  data: GlAccountResponse | null;
}

// ---- API base -------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---- Helpers --------------------------------------------------
function getAuthAndHotel() {
  const storedToken = localStorage.getItem("hotelmateTokens");
  const parsedToken = storedToken ? JSON.parse(storedToken) : null;
  const accessToken: string | undefined = parsedToken?.accessToken;

  const selectedProperty = localStorage.getItem("selectedProperty");
  const property = selectedProperty ? JSON.parse(selectedProperty) : {};
  const hotelId: string | undefined = property?.id;

  return { accessToken, hotelId };
}

async function parseMaybeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Some backends return text/plain with JSON-looking text; return raw text if not JSON.
    return text;
  }
}

// ---- Thunk ----------------------------------------------------
export const createGlAccount = createAsyncThunk<
  GlAccountResponse, // return type
  GlAccountPayload, // arg type
  { rejectValue: string }
>("glAccount/create", async (payload, { rejectWithValue }) => {
  const { accessToken, hotelId } = getAuthAndHotel();

  if (!accessToken) return rejectWithValue("Missing access token.");
  if (!hotelId) return rejectWithValue("No selected property (hotelId).");

  const body = {
    glAccountDto: {
      AccountID: 0,
      AccountTypeID: payload.accountTypeID,
      AccountCode: payload.accountCode,
      AccountName: payload.accountName,
      Description: payload.description ?? "",
      AccDetailTypeID: payload.accDetailTypeID,
      FinAct: payload.finAct,
    },
    AccountTypeID: payload.accountTypeID,
    AccountCode: payload.accountCode,
    AccountName: payload.accountName,
    Description: payload.description ?? "",
    AccDetailTypeID: payload.accDetailTypeID,
    FinAct: payload.finAct,
    hotelID: String(hotelId), // server wants this as string
  };

  try {
    const res = await fetch(`${API_BASE}/api/GlAccount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        // The spec lists text/plain; most stacks still accept JSON and return JSON.
        // Accept both gracefully by parsing text below.
        Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
      },
      body: JSON.stringify(body),
    });

    const data = await parseMaybeJson(res);

    if (!res.ok) {
      // Surface raw server message to the UI/console so you know *why* it's 400
      const raw = typeof data === "string" ? data : JSON.stringify(data);
      console.error("GL Account create failed:", res.status, raw);
      return rejectWithValue(`HTTP ${res.status}: ${raw}`);
    }

    // Ensure we return an object shaped like GlAccountResponse if possible
    return data as GlAccountResponse;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Network error");
  }
});

// ---- Slice ----------------------------------------------------
const initialState: CreateState = {
  loading: false,
  error: null,
  data: null,
};

const glAccountCreateSlice = createSlice({
  name: "glAccountCreate",
  initialState,
  reducers: {
    resetGlAccountCreate(state) {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGlAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
        // keep previous data (useful if UI wants to show last created)
      })
      .addCase(
        createGlAccount.fulfilled,
        (state, action: PayloadAction<GlAccountResponse>) => {
          state.loading = false;
          state.data = action.payload; // <-- created account returned to UI
          state.error = null;
        }
      )
      .addCase(createGlAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create GL account";
      });
  },
});

export const { resetGlAccountCreate } = glAccountCreateSlice.actions;
export default glAccountCreateSlice.reducer;

// ---- Selectors -----------------------------------------------
export const selectGlAccountCreateLoading = (s: RootState) =>
  s.glAccountCreate.loading;
export const selectGlAccountCreateError = (s: RootState) =>
  s.glAccountCreate.error;
export const selectCreatedGlAccount = (s: RootState) => s.glAccountCreate.data;
