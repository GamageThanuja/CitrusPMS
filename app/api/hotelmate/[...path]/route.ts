import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const UPSTREAM = `${BASE_URL}/api`;

function pickPassthroughHeaders(r: Response) {
  const out = new Headers();
  for (const [k, v] of r.headers.entries()) {
    const key = k.toLowerCase();
    if (
      key === "content-type" ||
      key === "etag" ||
      key === "last-modified" ||
      key === "cache-control"
    ) {
      out.set(k, v);
    }
  }
  return out;
}

async function forward(req: NextRequest, pathParts: string[]) {
  const path = pathParts.join("/");
  const search = req.nextUrl.search || "";
  const url = `${UPSTREAM}/${path}${search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  const ct = req.headers.get("content-type");
  if (auth) headers.set("authorization", auth);
  if (ct) headers.set("content-type", ct);

  // Debug
  console.log("[proxy] auth header received:", auth ? "yes" : "no", "|", url);

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    body = Buffer.from(buf);
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });
    const payload = await upstream.arrayBuffer();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: pickPassthroughHeaders(upstream),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Upstream fetch failed", message: e?.message || String(e) },
      { status: 502 }
    );
  }
}

// 👇 IMPORTANT: in App Router, params is a Promise — await it.
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
