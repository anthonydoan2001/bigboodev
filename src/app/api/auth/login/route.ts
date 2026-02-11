import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSession, cleanupExpiredSessions } from '@/lib/session';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * POST /api/auth/login
 * Authenticates user with password, creates DB-backed session, sets HttpOnly cookie
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const expectedPassword = process.env.DASHBOARD_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Timing-safe password comparison using SHA-256 to avoid length oracle
    const passwordHash = crypto.createHash('sha256').update(password).digest();
    const expectedHash = crypto
      .createHash('sha256')
      .update(expectedPassword)
      .digest();

    if (!crypto.timingSafeEqual(passwordHash, expectedHash)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Extract request metadata
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    // Create DB-backed session
    const { token, expiresAt } = await createSession({ ipAddress, userAgent });

    // Fire-and-forget cleanup of expired sessions
    cleanupExpiredSessions().catch(() => {});

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieFlags = [
      `dashboard_session_token=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${SESSION_MAX_AGE}`,
      ...(isProduction ? ['Secure'] : []),
    ].join('; ');

    return NextResponse.json(
      { success: true, expiresAt: expiresAt.toISOString() },
      {
        status: 200,
        headers: { 'Set-Cookie': cookieFlags },
      }
    );
  } catch (error) {
    console.error(
      'Login error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
