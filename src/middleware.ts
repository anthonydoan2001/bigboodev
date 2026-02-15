import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'dashboard_session_token';

/**
 * Timing-safe comparison for Edge Runtime (no crypto.timingSafeEqual).
 * Hashes both values with SHA-256 and compares the digests byte-by-byte.
 */
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [aDigest, bDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const aArr = new Uint8Array(aDigest);
  const bArr = new Uint8Array(bDigest);
  if (aArr.length !== bArr.length) return false;
  let result = 0;
  for (let i = 0; i < aArr.length; i++) {
    result |= aArr[i] ^ bArr[i];
  }
  return result === 0;
}

/**
 * Next.js middleware — UX layer for route protection.
 *
 * Checks cookie *presence* only (Edge Runtime cannot use Prisma).
 * Full DB validation happens in withAuth / withAuthOrCron per-route.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Allow cron jobs with valid CRON_SECRET (timing-safe comparison)
  const authHeader =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader && await timingSafeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.next();
  }

  // Check for session cookie presence
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect frontend pages to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
