// lib/tokenManager.ts
interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  createdAt: number;
  exp?: number; // expiry from token
}

let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let refreshTimer: NodeJS.Timeout | null = null;

// === NEW: persistence mode & helpers =========================
type PersistMode = "local" | "session";

// Default to what's saved (or local)
let storageMode: PersistMode =
  typeof window !== "undefined" &&
  localStorage.getItem("hmPersist") === "session"
    ? "session"
    : "local";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getActiveStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return storageMode === "session" ? sessionStorage : localStorage;
}

function getOtherStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return storageMode === "session" ? localStorage : sessionStorage;
}

export function setTokenPersistence(mode: PersistMode) {
  storageMode = mode;
  if (typeof window !== "undefined") {
    // Remember the preference so future loads pick the same mode
    localStorage.setItem("hmPersist", mode);
  }
}
// ============================================================

function decodeJwt(token: string): { exp: number } | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function loadStoredTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;

  // ✅ Always try localStorage first (app expects tokens there)
  const rawLocal = localStorage.getItem("hotelmateTokens");
  if (rawLocal) return JSON.parse(rawLocal) as StoredTokens;

  // Then try sessionStorage as a fallback (for mirrored copy)
  const rawSession = sessionStorage.getItem("hotelmateTokens");
  if (rawSession) return JSON.parse(rawSession) as StoredTokens;

  return null;
}

function saveTokens(tokens: StoredTokens) {
  currentAccessToken = tokens.accessToken;
  currentRefreshToken = tokens.refreshToken;

  // ⏰ Setup auto refresh before expiry
  if (refreshTimer) clearTimeout(refreshTimer);
  const exp = tokens.exp ?? decodeJwt(tokens.accessToken)?.exp;
  if (exp) {
    const refreshAt = (exp - 120) * 1000; // refresh 2 min before expiry
    const delay = Math.max(refreshAt - Date.now(), 10_000);
    refreshTimer = setTimeout(() => refreshToken(), delay);
  }

  if (typeof window !== "undefined") {
    // ✅ Always keep a copy in localStorage (backward compatibility)
    localStorage.setItem("hotelmateTokens", JSON.stringify(tokens));

    // ✅ If ephemeral mode, mirror into sessionStorage (optional)
    const hmPersist = localStorage.getItem("hmPersist");
    if (hmPersist === "session") {
      sessionStorage.setItem("hotelmateTokens", JSON.stringify(tokens));
    } else {
      // Clean mirror if we switched back to persistent
      sessionStorage.removeItem("hotelmateTokens");
    }
  }
}

export function seedInitialTokens(accessToken: string, refreshToken: string) {
  const decoded = decodeJwt(accessToken);
  saveTokens({
    accessToken,
    refreshToken,
    createdAt: Date.now(),
    exp: decoded?.exp,
  });
}

async function fetchNewTokens(): Promise<string> {
  const stored = loadStoredTokens();
  if (!stored) {
    throw new Error("No stored tokens to refresh. Please login again.");
  }

  const res = await fetch(`${BASE_URL}/api/Auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
    }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const json = await res.json();
  const decoded = decodeJwt(json.accessToken);

  const next: StoredTokens = {
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
    createdAt: Date.now(),
    exp: decoded?.exp,
  };

  saveTokens(next);
  return next.accessToken;
}

export async function getToken(): Promise<string> {
  const stored = loadStoredTokens();

  if (stored) {
    const now = Date.now() / 1000;
    const exp = stored.exp ?? decodeJwt(stored.accessToken)?.exp;

    // if token valid for at least 2 minutes → reuse
    if (exp && exp - now > 120) {
      currentAccessToken = stored.accessToken;
      currentRefreshToken = stored.refreshToken;
      return currentAccessToken;
    }
  }

  return fetchNewTokens();
}

export async function refreshToken(): Promise<string> {
  return fetchNewTokens();
}

export function clearTokens() {
  currentAccessToken = null;
  currentRefreshToken = null;
  if (refreshTimer) clearTimeout(refreshTimer);

  if (typeof window !== "undefined") {
    // Only remove our keys; do NOT nuke all storage
    const keys = [
      "hotelmateTokens",
      "accessToken",
      "refreshToken",
      "tokenExp",
      "tokenIssuer",
      "tokenAudience",
      "status",
    ];

    [localStorage, sessionStorage].forEach((store) => {
      try {
        keys.forEach((k) => store.removeItem(k));
      } catch {}
    });
  }
}

// === UPDATED: helpers that respect persistence ===================
export const getAccessToken = () => {
  if (typeof window === "undefined") return null;

  const active = getActiveStorage();
  const other = getOtherStorage();
  const raw =
    active?.getItem("hotelmateTokens") ?? other?.getItem("hotelmateTokens");

  if (raw) {
    try {
      const obj = JSON.parse(raw) as StoredTokens;
      return obj.accessToken ?? null;
    } catch {
      return null;
    }
  }
  // legacy fallback keys
  return (
    (active?.getItem("accessToken") ?? other?.getItem("accessToken")) || null
  );
};

export function getTokenExp(): number | null {
  if (typeof window === "undefined") return null;

  // Prefer exp inside stored tokens
  const stored = loadStoredTokens();
  if (stored?.exp) return stored.exp;

  // Legacy separate key
  const active = getActiveStorage();
  const other = getOtherStorage();
  const expStr = active?.getItem("tokenExp") ?? other?.getItem("tokenExp");
  return expStr ? Number(expStr) : null;
}

export function isAuthenticated(): boolean {
  const at = getAccessToken();
  const exp = getTokenExp();
  if (!at || !exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now;
}
