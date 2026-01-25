import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { KomgaClient } from '@/lib/komga';

// POST - Test connection with provided credentials
export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { serverUrl, email, password } = body;

    // Validate required fields
    if (!serverUrl || !email || !password) {
      return NextResponse.json(
        { error: 'Server URL, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(serverUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid server URL format' },
        { status: 400 }
      );
    }

    // Test connection
    const client = new KomgaClient(serverUrl, email, password);
    const result = await client.testConnection();

    if (result.success) {
      // Get library count as additional verification
      try {
        const libraries = await client.getLibraries();
        return NextResponse.json({
          success: true,
          message: 'Successfully connected to Komga',
          libraryCount: libraries.length,
        });
      } catch {
        return NextResponse.json({
          success: true,
          message: 'Successfully connected to Komga',
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to authenticate. Please check your credentials.',
      });
    }
  } catch (error) {
    console.error('Komga connection test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Komga server',
      },
      { status: 500 }
    );
  }
});
