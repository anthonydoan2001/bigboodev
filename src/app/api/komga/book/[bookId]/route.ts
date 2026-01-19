import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { KomgaBook } from '@/types/komga';

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

export const GET = withAuth(async (request: NextRequest) => {
  try {
    if (!KOMGA_API_URL || !KOMGA_USERNAME || !KOMGA_PASSWORD) {
      console.error('Komga API not configured - missing environment variables');
      return NextResponse.json(
        { error: 'Komga API not configured' },
        { status: 500 }
      );
    }

    // Extract bookId from URL path since withAuth doesn't pass context
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookIdIndex = pathParts.indexOf('book') + 1;
    const bookId = pathParts[bookIdIndex];
    
    if (!bookId) {
      console.error('Book ID is missing from URL path:', url.pathname);
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const bookUrl = `${KOMGA_API_URL}/books/${bookId}`;
    console.log(`Fetching book metadata from: ${bookUrl}`);
    
    const authHeaders = getAuthHeaders();
    const response = await fetch(bookUrl, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Komga API error ${response.status}:`, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Komga API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: KomgaBook = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching book metadata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch book metadata', details: errorMessage },
      { status: 500 }
    );
  }
});
