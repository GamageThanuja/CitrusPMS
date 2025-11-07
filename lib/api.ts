import axios from "axios";

// Base to your proxy
export const api = axios.create({
  baseURL: "/api/hotelmate",
  timeout: 20000,
});

// Attach token from localStorage
api.interceptors.request.use((cfg) => {
  const raw =
    typeof window !== "undefined"
      ? localStorage.getItem("hotelmateTokens")
      : null;
  if (raw) {
    try {
      const { accessToken } = JSON.parse(raw);
      if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
    } catch {}
  }
  return cfg;
});

// --- Optional: auto-refresh on 401 (if your backend supports it) ---
let isRefreshing = false;
let waiters: Array<(t: string) => void> = [];

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) return new Promise((r) => waiters.push(r));
  isRefreshing = true;
  try {
    const raw = localStorage.getItem("hotelmateTokens");
    const parsed = raw ? JSON.parse(raw) : {};
    const refreshToken = parsed?.refreshToken;
    if (!refreshToken) throw new Error("No refresh token");

    // Adjust to your real refresh endpoint/payload
    const r = await fetch("/api/hotelmate/Auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!r.ok) throw new Error(`Refresh failed: ${r.status}`);
    const json = await r.json();
    const newAccess = json?.accessToken;
    if (!newAccess) throw new Error("No accessToken in refresh response");

    localStorage.setItem(
      "hotelmateTokens",
      JSON.stringify({ accessToken: newAccess, refreshToken })
    );
    waiters.forEach((fn) => fn(newAccess));
    waiters = [];
    return newAccess;
  } catch {
    waiters.forEach((fn) => fn(""));
    waiters = [];
    return null;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};
    if (status === 401 && !original._retry) {
      original._retry = true;
      const newAccess = await refreshToken();
      if (newAccess) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original); // retry once
      } else {
        localStorage.removeItem("hotelmateTokens");
        // Optionally redirect to login:
        // window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
