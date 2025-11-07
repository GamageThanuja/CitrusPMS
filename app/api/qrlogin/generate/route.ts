// app/api/qrlogin/generate/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const sessionId = Math.random().toString(36).substring(2, 15);
  return NextResponse.json({ sessionId });
}