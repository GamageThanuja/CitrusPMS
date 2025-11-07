import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { seedInitialTokens } from "@/lib/tokenManager";
import { refreshToken as tmRefresh } from "@/lib/tokenManager";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
  tokenExpiry?: number | null; // unix seconds, derived from JWT exp
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  status: "idle",
  error: null,
  tokenExpiry: null,
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (
    { userName, password }: { userName: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || "Login failed");

      // Persist via tokenManager (writes hotelmateTokens, schedules auto-refresh)
      seedInitialTokens(data.accessToken, data.refreshToken);

      // Derive exp
      const payload = JSON.parse(atob(data.accessToken.split(".")[1] || ""));
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: typeof payload?.exp === "number" ? payload.exp : null,
      };
    } catch {
      return rejectWithValue("Network error");
    }
  }
);

// Register (regular)
export const register = createAsyncThunk(
  "auth/register",
  async (payload: any, { rejectWithValue }) => {
    const parseProblem = async (res: Response) => {
      // Try JSON first; fall back to text
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { title: text || "Registration failed" };
      }
    };

    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const problem = await parseProblem(res);
        // pass the entire problem object to the component
        return rejectWithValue(problem);
      }

      const data = await res.json();

      seedInitialTokens(data.accessToken, data.refreshToken);
      const payloadJwt = JSON.parse(atob(data.accessToken.split(".")[1] || ""));
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry:
          typeof payloadJwt?.exp === "number" ? payloadJwt.exp : null,
      };
    } catch {
      // network/parsing errors
      return rejectWithValue({ title: "Network error" });
    }
  }
);

// Refresh (use the **same** refresh as everywhere else)
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const newAccess = await tmRefresh(); // posts to /api/Auth/refresh with both tokens via tokenManager
      const payload = JSON.parse(atob(newAccess.split(".")[1] || ""));
      return {
        accessToken: newAccess,
        tokenExpiry: typeof payload?.exp === "number" ? payload.exp : null,
      };
    } catch {
      return rejectWithValue("Refresh token failed");
    }
  }
);

// Super Admin Register
export const registerSuperAdmin = createAsyncThunk(
  "auth/registerSuperAdmin",
  async ({
    fullName,
    email,
    password,
    role,
  }: {
    fullName: string;
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/register-super-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          username: email,
          password,
          role,
        }),
      });
      const data = await res.json();
      // even if the API sometimes errors, try to seed when tokens exist
      if (data?.accessToken && data?.refreshToken) {
        seedInitialTokens(data.accessToken, data.refreshToken);
        const payload = JSON.parse(atob(data.accessToken.split(".")[1] || ""));
        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiry: typeof payload?.exp === "number" ? payload.exp : null,
        };
      }
      return { accessToken: null, refreshToken: null, tokenExpiry: null };
    } catch {
      // don’t throw, keep UI flowing
      return { accessToken: null, refreshToken: null, tokenExpiry: null };
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
      state.tokenExpiry = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => {
      s.status = "loading";
    })
      .addCase(login.fulfilled, (s, a) => {
        s.status = "idle";
        s.accessToken = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.tokenExpiry = a.payload.tokenExpiry ?? null;
        s.error = null;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string;
      })

      .addCase(register.pending, (s) => {
        s.status = "loading";
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = "idle";
        s.accessToken = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.tokenExpiry = a.payload.tokenExpiry ?? null;
        s.error = null;
      })
      .addCase(register.rejected, (s, a) => {
        s.status = "failed";
        const p = a.payload as any;
        s.error = p?.title || p?.detail || p?.message || "Registration failed";
      })

      .addCase(registerSuperAdmin.pending, (s) => {
        s.status = "loading";
      })
      .addCase(registerSuperAdmin.fulfilled, (s, a) => {
        s.status = "idle";
        s.accessToken = a.payload.accessToken || null;
        s.refreshToken = a.payload.refreshToken || null;
        s.tokenExpiry = a.payload.tokenExpiry ?? null;
        s.error = null;
      })
      .addCase(registerSuperAdmin.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string;
      })

      .addCase(refreshToken.fulfilled, (s, a) => {
        s.accessToken = a.payload.accessToken;
        s.tokenExpiry = a.payload.tokenExpiry ?? null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
