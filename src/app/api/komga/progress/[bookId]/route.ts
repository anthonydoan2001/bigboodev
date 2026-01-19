import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

const KOMGA_API_URL = process.env.KOMGA_API_URL || 'https://komga.bigboo.dev/api/v1';
const KOMGA_USERNAME = process.env.KOMGA_USERNAME;
const KOMGA_PASSWORD = process.env.KOMGA_PASSWORD;

function getAuthHeaders(): HeadersInit {
  if (!KOMGA_USERNAME || !KOMGA_PASSWORD) {
    throw new Error('Komga credentials not configured');
  }
  
  const credentials = Buffer.from(`${KOMGA_USERNAME}:${KOMGA_PASSWORD}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

export const PATCH = withAuth(async (request: NextRequest) => {
  try {
    if (!KOMGA_API_URL || !KOMGA_USERNAME || !KOMGA_PASSWORD) {
      console.error('Komga API not configured - missing environment variables');
      return NextResponse.json(
        { error: 'Komga API not configured' },
        { status: 500 }
      );
    }

    // Extract bookId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const progressIndex = pathParts.indexOf('progress');
    const bookId = pathParts[progressIndex + 1];
    
    if (!bookId) {
      console.error('Book ID is missing from URL path:', url.pathname);
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { page, completed } = body;

    // Validate page number
    if (!page || typeof page !== 'number' || page < 1) {
      return NextResponse.json(
        { error: 'Valid page number is required' },
        { status: 400 }
      );
    }

    const progressUrl = `${KOMGA_API_URL}/books/${bookId}/read-progress`;
    console.log(`Saving progress for book ${bookId}: page ${page}, completed: ${completed || false}`);
    
    const authHeaders = getAuthHeaders();
    const response = await fetch(progressUrl, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        page,
        completed: completed || false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Komga progress save error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Failed to save progress: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving reading progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to save progress', details: errorMessage },
      { status: 500 }
    );
  }
});
