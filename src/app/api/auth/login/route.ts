import { NextResponse } from 'next/server';

/**
 * Generate a session token on the server
 */
function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * POST /api/auth/login
 * Authenticates user with password and returns session token
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
      console.error('DASHBOARD_PASSWORD environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Return session token
    // Client will store it in localStorage
    return NextResponse.json(
      { 
        success: true,
        token: sessionToken 
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `dashboard_session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`, // 1 year
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
