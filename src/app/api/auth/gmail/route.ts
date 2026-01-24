import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Gmail readonly scope
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

/**
 * GET /api/auth/gmail
 * Initiates Google OAuth flow for Gmail access
 */
export async function GET() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    console.error('Missing Google OAuth configuration');
    return NextResponse.json(
      { error: 'Gmail integration not configured' },
      { status: 500 }
    );
  }

  // Generate state parameter for CSRF protection
  const state = crypto.randomUUID();

  // Store state in cookie for validation in callback
  const cookieStore = await cookies();
  cookieStore.set('gmail_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

  return NextResponse.redirect(authUrl.toString());
}
