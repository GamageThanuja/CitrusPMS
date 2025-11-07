// hooks/usePublicIp.ts
"use client";

import { useEffect, useState } from "react";

type State = {
  ip: string | null;
  source: string | null;
  loading: boolean;
  error: string | null;
};

export function usePublicIp() {
  const [state, setState] = useState<State>({
    ip: null,
    source: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/myip", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        setState({
          ip: json?.ip ?? null,
          source: json?.source ?? null,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        if (!alive) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message || "Failed to fetch public IP",
        }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state; // { ip, source, loading, error }
}
