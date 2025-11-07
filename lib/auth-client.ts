// lib/auth-client.ts
"use client";

type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  createdAt?: number;
  exp?: number; // unix seconds
};

function readStored(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("hotelmateTokens");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const stored = readStored();
  return stored?.accessToken ?? localStorage.getItem("accessToken");
};

export const getTokenExp = (): number | null => {
  if (typeof window === "undefined") return null;
  const stored = readStored();
  if (stored?.exp) return stored.exp;
  const at = stored?.accessToken || localStorage.getItem("accessToken");
  return at ? decodeJwtExp(at) : null;
};

export function isAuthenticated(): boolean {
  const at = getAccessToken();
  const exp = getTokenExp();
  if (!at || !exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now;
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  const keys = [
    "hotelmateTokens",
    "accessToken",
    "refreshToken",
    "tokenExp",
    "tokenIssuer",
    "tokenAudience",
    "status",
  ];
  keys.forEach((k) => {
    try {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    } catch {}
  });
}

export function isPublicAllowedPath(pathname: string, search: string) {
  const searchParams = new URLSearchParams(search);

  const isSetPasswordFlow =
    (pathname === "/set-password" ||
      pathname === "/forgot-password/set-password") &&
    searchParams.has("email");

  const isGSSPathWithHotelCode =
    pathname.startsWith("/self-checking") && searchParams.has("hotelcode");

  const isFFPathWithHotelCode =
    pathname.startsWith("/feedback-form") && searchParams.has("hotelcode");

  // ✅ Add your public auth routes here
  const PUBLIC_EXACT = new Set([
    "/login",
    "/signup", // <<-- add
    "/add-rate",
    "/create-property",
    "/create-room-type",
    "/create-taxes",
    "/meal-allocation",
    "/register", // optional alias
    "/404",
  ]);

  // If you have a namespace like /auth/* consider it public:
  const isAuthNamespace = pathname.startsWith("/auth/");

  return (
    PUBLIC_EXACT.has(pathname) ||
    isAuthNamespace ||
    isSetPasswordFlow ||
    isGSSPathWithHotelCode ||
    isFFPathWithHotelCode
  );
}
