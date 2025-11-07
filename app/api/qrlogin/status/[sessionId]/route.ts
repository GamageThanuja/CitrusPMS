import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  // Mock logic — replace this with your actual session store
  const sessionExists = true; // simulate that the session exists
  const sessionAuthenticated = false; // simulate auth state

  if (!sessionExists) {
    return NextResponse.json({ expired: true }, { status: 200 });
  }

  if (sessionAuthenticated) {
    return NextResponse.json({ status: 'authenticated' }, { status: 200 });
  }

  return NextResponse.json({ status: 'waiting' }, { status: 200 });
}