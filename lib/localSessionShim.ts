// lib/localSessionShim.ts
import { clearTokens } from "@/lib/tokenManager";

/**
 * Makes tokens behave like sessionStorage while still living in localStorage,
 * so the rest of the app (which reads from localStorage) keeps working.
 *
 * Works only when hmPersist === "session".
 * - Increments a tab counter on mount.
 * - Decrements it on close.
 * - If it hits 0, schedules a delayed clear (3s) so reloads don't wipe tokens.
 */
export function initEphemeralLocalTokens() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("hmPersist") !== "session") return;

  const COUNT_KEY = "hmSessionCount";
  const PENDING_KEY = "hmPendingClearAt";
  const GRACE_MS = 3000; // avoid clearing on reloads

  const getCount = () => parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
  const setCount = (n: number) =>
    localStorage.setItem(COUNT_KEY, String(Math.max(0, n)));

  const cancelPendingClear = () => localStorage.removeItem(PENDING_KEY);

  const scheduleClearIfStillZero = () => {
    const clearAt = Date.now() + GRACE_MS;
    localStorage.setItem(PENDING_KEY, String(clearAt));

    setTimeout(() => {
      const stillZero = getCount() === 0;
      const pending = parseInt(localStorage.getItem(PENDING_KEY) || "0", 10);
      if (stillZero && pending && Date.now() >= pending) {
        try {
          // Only clear auth-related keys. Uses your existing helper:
          clearTokens();
        } finally {
          localStorage.removeItem(PENDING_KEY);
        }
      }
    }, GRACE_MS + 100);
  };

  // ---- on load: increment tab count, cancel any pending clear
  setCount(getCount() + 1);
  cancelPendingClear();

  // ---- on unload: decrement; if 0, schedule a clear
  const handlePageHide = () => {
    setCount(getCount() - 1);
    if (getCount() === 0) scheduleClearIfStillZero();
  };

  // Use both to cover most browsers (pagehide is better for bfcache)
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("unload", handlePageHide);
}
