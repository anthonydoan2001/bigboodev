import { NextResponse } from 'next/server';
import { getSessionInfo } from '@/lib/session';
import { getSessionToken } from '@/lib/api-auth';

/**
 * GET /api/auth/session
 * Returns current session info (for settings page display)
 */
export async function GET(request: Request) {
  const token = getSessionToken(request);

  if (!token) {
    return NextResponse.json({ active: false });
  }

  const info = await getSessionInfo(token);

  if (!info) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: info.active,
    createdAt: info.createdAt.toISOString(),
    expiresAt: info.expiresAt.toISOString(),
  });
}
