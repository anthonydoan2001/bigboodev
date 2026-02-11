import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateSession } from '@/lib/session';

/**
 * Server-side API authentication helper
 * Validates session token from cookies against the database
 */

const SESSION_COOKIE = 'dashboard_session_token';

/**
 * Extract session token from request cookies
 */
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const idx = cookie.indexOf('=');
        if (idx !== -1) {
          const key = cookie.substring(0, idx).trim();
          const value = cookie.substring(idx + 1).trim();
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    if (cookies[SESSION_COOKIE]) {
      return cookies[SESSION_COOKIE];
    }
  }

  return null;
}

/**
 * Validate session token against the database
 */
async function validateSessionToken(token: string | null): Promise<boolean> {
  if (!token) {
    return false;
  }
  return validateSession(token);
}

/**
 * Require authentication for API route
 * Returns the session token if valid, otherwise throws
 */
export async function requireAuth(request: Request): Promise<string> {
  const token = getSessionToken(request);

  if (!(await validateSessionToken(token))) {
    throw new Error('UNAUTHORIZED');
  }

  return token!;
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Check if request is authenticated via session OR cron secret
 */
export async function requireAuthOrCron(
  request: Request
): Promise<{ type: 'session' | 'cron'; token: string }> {
  const authHeader =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader) {
    const expected = `Bearer ${cronSecret}`;
    const aHash = crypto.createHash('sha256').update(authHeader).digest();
    const bHash = crypto.createHash('sha256').update(expected).digest();
    if (crypto.timingSafeEqual(aHash, bHash)) {
      return { type: 'cron', token: cronSecret };
    }
  }

  const token = await requireAuth(request);
  return { type: 'session', token };
}

/**
 * Wrapper for API route handlers that require authentication
 * Usage: export const GET = withAuth(async (request) => { ... })
 */
export function withAuth<T extends Request>(
  handler: (request: T, sessionToken: string) => Promise<NextResponse>
) {
  return async (request: T): Promise<NextResponse> => {
    try {
      const token = await requireAuth(request);
      return await handler(request, token);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return unauthorizedResponse();
      }
      throw error;
    }
  };
}

/**
 * Wrapper for API route handlers that accept either session auth or cron secret
 * Usage: export const GET = withAuthOrCron(async (request, auth) => { ... })
 */
export function withAuthOrCron<T extends Request>(
  handler: (
    request: T,
    auth: { type: 'session' | 'cron'; token: string }
  ) => Promise<NextResponse>
) {
  return async (request: T): Promise<NextResponse> => {
    try {
      const auth = await requireAuthOrCron(request);
      return await handler(request, auth);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return unauthorizedResponse();
      }
      throw error;
    }
  };
}
