import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy to protect all routes except /login and /api/auth/*
 * Checks for valid session token in cookies or headers
 * Also allows cron jobs with valid CRON_SECRET
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check for cron authentication (for refresh endpoints)
  // Vercel cron jobs send Authorization: Bearer ${CRON_SECRET} header
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If this is a refresh endpoint or cron-test endpoint, check for cron auth
  const isRefreshEndpoint = pathname.startsWith('/api/') && 
    (pathname.includes('/refresh') || pathname.includes('/cron-test'));
  
  if (isRefreshEndpoint) {
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return NextResponse.next();
    } else if (cronSecret && authHeader) {
      // Secret exists and header exists but doesn't match - log details
      console.warn('[Proxy] ✗ Cron auth failed - header mismatch', {
        headerLength: authHeader.length,
        secretLength: cronSecret.length,
        headerStartsWithBearer: authHeader.startsWith('Bearer '),
        headerValue: authHeader.substring(7, 20),
        secretValue: cronSecret.substring(0, 13),
      });
    } else if (cronSecret && !authHeader) {
      console.warn('[Proxy] ✗ Cron auth failed - no Authorization header');
    } else if (!cronSecret) {
      console.warn('[Proxy] ✗ CRON_SECRET not set in environment');
    }
  }

  // Check for session token in cookies
  const sessionToken = request.cookies.get('dashboard_session_token')?.value;

  // Also check header (for API routes)
  const headerToken = request.headers.get('x-session-token');

  const token = sessionToken || headerToken;

  // Validate token format
  const isValidToken = token && token.startsWith('session_') && token.length > 20;

  // If no valid token, redirect to login (except for API routes)
  if (!isValidToken) {
    if (pathname.startsWith('/api/')) {
      // API routes return 401
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      // Frontend routes redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
