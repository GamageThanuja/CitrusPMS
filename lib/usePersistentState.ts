import { useEffect, useRef, useState } from "react";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** localStorage-backed state that survives refreshes. */
export function usePersistentState<T>(
  key: string,
  initial: T,
  {
    storage = typeof window !== "undefined" ? window.localStorage : undefined,
  } = {}
) {
  const isHydrated = useRef(false);
  const [state, setState] = useState<T>(() => {
    if (!storage) return initial;
    return safeParse<T>(storage.getItem(key), initial);
  });

  // Write-through on change
  useEffect(() => {
    if (!storage) return;
    // prevent overwriting server-rendered default before first read
    if (!isHydrated.current) {
      isHydrated.current = true;
      return;
    }
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state, storage]);

  return [state, setState] as const;
}
