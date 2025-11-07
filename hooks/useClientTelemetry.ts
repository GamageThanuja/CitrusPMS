// hooks/useClientTelemetry.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { parseUserAgent } from "@/lib/ua";

export type ClientTelemetry = {
  // From server
  ip?: string | null;
  proxyChain?: string | null;
  edgeCountry?: string | null;
  serverUserAgent?: string;

  // From client
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  device?: string;

  // Hints (when available via UA-CH)
  brandList?: Array<{ brand: string; version: string }>;
  platform?: string;
  mobile?: boolean | null;
  architecture?: string | null;
  bitness?: string | null;
  model?: string | null;
  uaFullVersion?: string | null;

  // Environment
  timezone?: string;
  locale?: string;
  languages?: string[];
  screen?: { width: number; height: number; pixelRatio: number };
  hardwareConcurrency?: number | null;
  deviceMemoryGB?: number | null;
  online?: boolean;
  doNotTrack?: "1" | "0" | "yes" | null; // normalized
  referrer?: string | null;

  // Extra signals
  navigatorPlatform?: string;
  maxTouchPoints?: number;
  suspectedEmulation?: boolean;
  uaSourceHint?: "likely_emulated" | "browser_default";

  // Timing
  capturedAt: string;
};

function normalizeDnt(dnt: any): "1" | "0" | "yes" | null {
  if (dnt === "1" || dnt === "0" || dnt === "yes") return dnt;
  return null;
}

export function useClientTelemetry() {
  const [data, setData] = useState<ClientTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snapshot immediately with safe browser guards
  const clientSnapshot = useMemo<ClientTelemetry>(() => {
    if (typeof window === "undefined") {
      return { capturedAt: new Date().toISOString() };
    }

    const nav = navigator as any;
    const ua = navigator.userAgent || "";
    const parsed = parseUserAgent(ua);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language;
    const languages = navigator.languages || [locale];

    const screenInfo = {
      width: window.screen?.width ?? 0,
      height: window.screen?.height ?? 0,
      pixelRatio: window.devicePixelRatio ?? 1,
    };

    const hardwareConcurrency =
      typeof navigator.hardwareConcurrency === "number"
        ? navigator.hardwareConcurrency
        : null;

    const deviceMemoryGB =
      typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;

    const online = navigator.onLine;
    const doNotTrack = normalizeDnt((navigator as any).doNotTrack);
    const referrer = document.referrer || null;

    // Raw platform & touch signals for emulation detection
    const navigatorPlatform =
      (nav.userAgentData?.platform as string) ||
      (navigator.platform as string) ||
      "";

    const maxTouchPoints =
      typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : 0;

    // crude emulation heuristic
    const looksMobileUA =
      /android|iphone|ipad|mobile/i.test(ua) ||
      nav.userAgentData?.mobile === true;
    const looksMacPlatform = /mac/i.test(navigatorPlatform);
    const suspectedEmulation = looksMobileUA && looksMacPlatform;

    return {
      userAgent: ua,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion,
      os: parsed.os,
      device: parsed.device,

      timezone: tz,
      locale,
      languages,
      screen: screenInfo,
      hardwareConcurrency,
      deviceMemoryGB,
      online,
      doNotTrack,
      referrer,

      navigatorPlatform,
      maxTouchPoints,
      suspectedEmulation,
      uaSourceHint: suspectedEmulation ? "likely_emulated" : "browser_default",

      // these will be enriched below if UA-CH is available
      brandList: undefined,
      platform: undefined,
      mobile: null,
      architecture: null,
      bitness: null,
      model: null,
      uaFullVersion: null,

      capturedAt: new Date().toISOString(),
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function enrich() {
      try {
        const [ipRes, uaCh] = await Promise.all([
          fetch("/api/telemetry", { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => null),

          (async () => {
            const nav: any = navigator;
            if (nav.userAgentData?.getHighEntropyValues) {
              try {
                const v = await nav.userAgentData.getHighEntropyValues([
                  "architecture",
                  "bitness",
                  "platform",
                  "model",
                  "uaFullVersion",
                ]);
                return {
                  brandList: nav.userAgentData.brands as Array<{
                    brand: string;
                    version: string;
                  }>,
                  platform: (v.platform as string) || undefined,
                  mobile: nav.userAgentData.mobile ?? null,
                  architecture: (v.architecture as string) || null,
                  bitness: (v.bitness as string) || null,
                  model: (v.model as string) || null,
                  uaFullVersion: (v.uaFullVersion as string) || null,
                };
              } catch {
                return null;
              }
            }
            return null;
          })(),
        ]);

        if (!alive) return;

        setData({
          ...clientSnapshot,
          ...(ipRes ?? {}),
          ...(uaCh ?? {}),
        });
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to collect telemetry");
        setData(clientSnapshot);
        setLoading(false);
      }
    }

    enrich();
    return () => {
      alive = false;
    };
  }, [clientSnapshot]);

  return { data, loading, error };
}
