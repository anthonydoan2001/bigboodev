import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  email: string;
  name?: string;
}

/**
 * GET /api/auth/gmail/callback
 * Handles OAuth callback from Google
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Get the base URL for redirects
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://bigboo.dev'
    : 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('Gmail OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/?gmail_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    console.error('Missing code or state in callback');
    return NextResponse.redirect(`${baseUrl}/?gmail_error=missing_params`);
  }

  // Validate state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get('gmail_oauth_state')?.value;

  if (!storedState || storedState !== state) {
    console.error('State mismatch in Gmail OAuth callback');
    return NextResponse.redirect(`${baseUrl}/?gmail_error=invalid_state`);
  }

  // Clear the state cookie
  cookieStore.delete('gmail_oauth_state');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.error('Missing Google OAuth configuration');
    return NextResponse.redirect(`${baseUrl}/?gmail_error=config_error`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Failed to exchange code for tokens:', errorData);
      return NextResponse.redirect(`${baseUrl}/?gmail_error=token_exchange_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    if (!tokens.refresh_token) {
      console.error('No refresh token received - user may need to revoke access and try again');
      // This can happen if the user has already authorized the app before
      // We'll try to proceed with just the access token, but it won't persist
    }

    // Get user's email address
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.redirect(`${baseUrl}/?gmail_error=userinfo_failed`);
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      console.error('No email in user info response');
      return NextResponse.redirect(`${baseUrl}/?gmail_error=no_email`);
    }

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert tokens in database
    await db.gmailToken.upsert({
      where: { email: userInfo.email },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt,
      },
      create: {
        email: userInfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        expiresAt,
      },
    });

    console.log(`Gmail connected successfully for ${userInfo.email}`);

    // Redirect to dashboard with success
    return NextResponse.redirect(`${baseUrl}/?gmail_connected=true`);
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?gmail_error=unknown`);
  }
}
