import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { CalibreWebClient } from '@/lib/calibre-web';

// POST - Test connection with provided credentials
export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { serverUrl, username, password } = body;

    if (!serverUrl || !username || !password) {
      return NextResponse.json(
        { error: 'Server URL, username, and password are required' },
        { status: 400 }
      );
    }

    try {
      new URL(serverUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid server URL format' },
        { status: 400 }
      );
    }

    const client = new CalibreWebClient(serverUrl, username, password);
    const result = await client.testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Calibre-Web',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to authenticate. Please check your credentials.',
      });
    }
  } catch (error) {
    console.error('Calibre-Web connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Calibre-Web server',
      },
      { status: 500 }
    );
  }
});
