// app/api/myip/route.ts
import { NextResponse } from "next/server";

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

const PROVIDERS = [
  "https://api.ipify.org?format=text",
  "https://checkip.amazonaws.com",
  "https://ifconfig.me/ip",
  "https://icanhazip.com",
  "https://ident.me",
];

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function tryFetch(url: string): Promise<string | null> {
  try {
    const r = await withTimeout(fetch(url, { cache: "no-store" }), 3000);
    if (!r.ok) return null;
    const text = (await r.text()).trim().replace(/[\r\n"]/g, "");
    if (IPV4_RE.test(text) || IPV6_RE.test(text)) return text;
    // tolerate simple JSON like {"ip":"1.2.3.4"}
    const m = text.match(/"ip"\s*:\s*"([^"]+)"/i);
    if (m && (IPV4_RE.test(m[1]) || IPV6_RE.test(m[1]))) return m[1];
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  // Prefer IPv4 first: try all providers, return first IPv4; if none, accept IPv6
  let winner: { ip: string | null; src: string | null } = {
    ip: null,
    src: null,
  };

  // Try for IPv4
  for await (const url of PROVIDERS) {
    const ip = await tryFetch(url);
    if (ip && IPV4_RE.test(ip)) {
      winner = { ip, src: url };
      break;
    }
  }

  // If still none, accept IPv6
  if (!winner.ip) {
    for await (const url of PROVIDERS) {
      const ip = await tryFetch(url);
      if (ip) {
        winner = { ip, src: url };
        break;
      }
    }
  }

  return NextResponse.json({
    ip: winner.ip,
    source: winner.src,
    timestamp: new Date().toISOString(),
  });
}
