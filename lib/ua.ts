// lib/ua.ts
export type ParsedUA = {
  browser: string;
  browserVersion?: string;
  os: string;
  device?: string;
};

export function parseUserAgent(ua: string): ParsedUA {
  const s = ua.toLowerCase();

  // Browser
  let browser = "Unknown";
  let browserVersion: string | undefined;
  if (s.includes("edg/")) {
    browser = "Edge";
    browserVersion = s.split("edg/")[1]?.split(" ")[0];
  } else if (s.includes("firefox/")) {
    browser = "Firefox";
    browserVersion = s.split("firefox/")[1]?.split(" ")[0];
  } else if (s.includes("chrome/") && !s.includes("edg/")) {
    browser = "Chrome";
    browserVersion = s.split("chrome/")[1]?.split(" ")[0];
  } else if (s.includes("safari/") && s.includes("version/")) {
    browser = "Safari";
    browserVersion = s.split("version/")[1]?.split(" ")[0];
  }

  // OS
  let os = "Unknown";
  if (s.includes("windows nt")) os = "Windows";
  else if (s.includes("mac os x")) os = "macOS";
  else if (s.includes("android")) os = "Android";
  else if (s.includes("iphone") || s.includes("ipad") || s.includes("ipod"))
    os = "iOS";
  else if (s.includes("linux")) os = "Linux";

  // Device (rough)
  let device: string | undefined;
  if (/iphone|ipad|ipod|android|mobile/.test(s)) device = "Mobile/Tablet";
  else device = "Desktop";

  return { browser, browserVersion, os, device };
}
