import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect all routes except /login and /api/auth/*
 * Checks for valid session token in cookies or headers
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
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

// Configure which routes to run middleware on
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
