import { NextResponse } from 'next/server';

/**
 * Server-side API authentication helper
 * Validates session token from request headers or cookies
 */

const SESSION_HEADER = 'x-session-token';
const SESSION_COOKIE = 'dashboard_session_token';

/**
 * Extract session token from request
 * Checks both headers and cookies
 */
export function getSessionToken(request: Request): string | null {
  // Check header first
  const headerToken = request.headers.get(SESSION_HEADER);
  if (headerToken) {
    return headerToken;
  }

  // Check cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies[SESSION_COOKIE]) {
      return cookies[SESSION_COOKIE];
    }
  }

  return null;
}

/**
 * Validate session token
 * For single-user app, we just check that token exists and matches expected format
 * In a real multi-user system, you'd verify against a database
 */
export function validateSessionToken(token: string | null): boolean {
  if (!token) {
    return false;
  }
  // Basic validation - token should start with 'session_' and have reasonable length
  return token.startsWith('session_') && token.length > 20;
}

/**
 * Require authentication for API route
 * Returns the session token if valid, otherwise throws an error response
 */
export function requireAuth(request: Request): string {
  const token = getSessionToken(request);
  
  if (!validateSessionToken(token)) {
    throw new Error('UNAUTHORIZED');
  }

  return token!;
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Check if request is authenticated via session OR cron secret
 * Useful for refresh routes that can be called by cron jobs or authenticated users
 */
export function requireAuthOrCron(request: Request): { type: 'session' | 'cron'; token: string } {
  // Check cron secret first
  // Try both lowercase and capitalized header names (HTTP headers are case-insensitive but Next.js might normalize)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { type: 'cron', token: cronSecret };
  }
  
  // Otherwise require session auth
  const token = requireAuth(request);
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
      const token = requireAuth(request);
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
 * Usage: export const GET = withAuthOrCronWrapper(async (request, auth) => { ... })
 */
export function withAuthOrCron<T extends Request>(
  handler: (request: T, auth: { type: 'session' | 'cron'; token: string }) => Promise<NextResponse>
) {
  return async (request: T): Promise<NextResponse> => {
    try {
      const auth = requireAuthOrCron(request);
      return await handler(request, auth);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return unauthorizedResponse();
      }
      throw error;
    }
  };
}
