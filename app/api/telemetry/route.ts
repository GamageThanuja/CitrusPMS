// app/api/telemetry/route.ts
import { NextRequest, NextResponse } from "next/server";

// Normalize IPv4/6 and strip ports; map loopback to 127.0.0.1
function normalizeIp(raw?: string | null) {
  if (!raw) return null;

  // If header contains a chain, take the first entry
  const first = raw.split(",")[0].trim();

  // Remove ":port"
  const noPort = first.replace(/:\d+$/, "");

  // IPv6-mapped IPv4 -> extract IPv4
  const v4 = noPort.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/i);
  if (v4) return v4[1];

  // Loopback normalize
  if (noPort === "::1") return "127.0.0.1";

  return noPort;
}

function getIp(req: NextRequest) {
  const h = (k: string) => req.headers.get(k);

  // 1) Cloudflare (if present)
  const cf = normalizeIp(h("cf-connecting-ip"));
  if (cf) return { ip: cf, chain: h("x-forwarded-for") || null };

  // 2) Standard proxy chain
  const xff = h("x-forwarded-for");
  if (xff) return { ip: normalizeIp(xff), chain: xff };

  // 3) Nginx/other direct header
  const real = normalizeIp(h("x-real-ip"));
  if (real) return { ip: real, chain: xff || null };

  // 4) Last resort (often undefined)
  // @ts-ignore
  const reqIp = normalizeIp((req as any).ip || null);
  return { ip: reqIp, chain: xff || null };
}

export async function GET(req: NextRequest) {
  const { ip, chain } = getIp(req);

  return NextResponse.json({
    ip,
    proxyChain: chain,
    serverUserAgent: req.headers.get("user-agent") || "",
    referer: req.headers.get("referer") || "",
    edgeCountry: req.headers.get("cf-ipcountry") || null,
    timestamp: new Date().toISOString(),
  });
}
