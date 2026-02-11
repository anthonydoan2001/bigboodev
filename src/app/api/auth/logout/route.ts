import { NextResponse } from 'next/server';
import { revokeSession } from '@/lib/session';
import { getSessionToken } from '@/lib/api-auth';

/**
 * POST /api/auth/logout
 * Revokes the current session and clears the cookie
 */
export async function POST(request: Request) {
  const token = getSessionToken(request);

  if (token) {
    await revokeSession(token);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const clearCookie = [
    'dashboard_session_token=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');

  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': clearCookie } }
  );
}
