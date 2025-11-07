"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  clearTokens,
  isPublicAllowedPath,
} from "@/lib/auth-client";
import { useAutoTokenRefresher } from "@/hooks/useAutoTokenRefresher"; // you can keep this, or ignore

export function ClientSideWrapper({ children }: { children: React.ReactNode }) {
  useAutoTokenRefresher(); // harmless, or remove if not needed now

  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      const pathname = window.location.pathname;
      const search = window.location.search;
      if (isPublicAllowedPath(pathname, search)) return;
      if (!isAuthenticated()) {
        clearTokens();
        router.replace("/login");
      }
    }, 15000); // check every 15s (adjust as you like)
    return () => clearInterval(t);
  }, [router]);

  return <>{children}</>;
}
