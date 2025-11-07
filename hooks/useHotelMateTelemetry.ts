// hooks/useHotelMateTelemetry.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { parseUserAgent } from "@/lib/ua"; // from earlier

export type HotelMateTelemetry = {
  // From /api/telemetry (server-observed)
  ip?: string | null;
  ipSource?: string | null; // only if your /api/telemetry adds this; safe to omit
  proxyChain?: string | null;
  edgeCountry?: string | null;
  serverUserAgent?: string;

  // From /api/myip (external providers → public IP)
  publicIp?: string | null;
  publicIpSource?: string | null;

  // Client signals
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  device?: string;

  // UA-CH (when available)
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
  doNotTrack?: "1" | "0" | "yes" | null;
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

type State = {
  data: HotelMateTelemetry | null;
  loading: boolean;
  error: string | null;
};

export function useHotelMateTelemetry() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  // 1) Immediate client snapshot (SSR-safe)
  const snapshot = useMemo<HotelMateTelemetry>(() => {
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

    const navigatorPlatform =
      (nav.userAgentData?.platform as string) ||
      (navigator.platform as string) ||
      "";

    const maxTouchPoints =
      typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : 0;

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

      // to be enriched
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

  // 2) Enrich with UA-CH + server headers + public IP
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function run() {
      try {
        // Requests in parallel
        const uaChPromise = (async () => {
          const nav: any = navigator;
          if (nav.userAgentData?.getHighEntropyValues) {
            try {
              const v = await nav.userAgentData.getHighEntropyValues(
                [
                  "architecture",
                  "bitness",
                  "platform",
                  "model",
                  "uaFullVersion",
                ],
                { signal: ctrl.signal }
              );
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
              /* ignore */
            }
          }
          return null;
        })();

        const telemetryPromise = fetch("/api/telemetry", {
          cache: "no-store",
          signal: ctrl.signal,
        })
          .then((r) => r.json())
          .catch(() => null);

        const myIpPromise = fetch("/api/myip", {
          cache: "no-store",
          signal: ctrl.signal,
        })
          .then((r) => r.json())
          .catch(() => null);

        const [uaCh, tele, myip] = await Promise.all([
          uaChPromise,
          telemetryPromise,
          myIpPromise,
        ]);

        if (!alive) return;

        const merged: HotelMateTelemetry = {
          ...snapshot,

          // server headers (what your edge/proxy sees)
          ...(tele ?? {}),

          // public IP provider (works even on localhost)
          ...(myip?.ip
            ? { publicIp: myip.ip, publicIpSource: myip.source ?? null }
            : {}),

          // client UA-CH
          ...(uaCh ?? {}),
        };

        setState({ data: merged, loading: false, error: null });
      } catch (e: any) {
        if (!alive) return;
        setState({
          data: snapshot,
          loading: false,
          error: e?.message || "Failed to collect telemetry",
        });
      }
    }

    run();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [snapshot]);

  return state; // { data, loading, error }
}
