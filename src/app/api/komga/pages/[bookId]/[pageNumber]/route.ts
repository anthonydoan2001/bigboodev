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
  };
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    if (!KOMGA_API_URL || !KOMGA_USERNAME || !KOMGA_PASSWORD) {
      console.error('Komga API not configured - missing environment variables');
      return new NextResponse('Komga API not configured', { status: 500 });
    }

    // Extract bookId and pageNumber from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const pagesIndex = pathParts.indexOf('pages');
    const bookId = pathParts[pagesIndex + 1];
    const pageNumber = pathParts[pagesIndex + 2];
    
    if (!bookId || !pageNumber) {
      console.error('Book ID or page number is missing from URL path:', url.pathname);
      return new NextResponse('Book ID and page number are required', { status: 400 });
    }

    // Validate page number (must be 1-indexed, positive integer)
    const page = parseInt(pageNumber, 10);
    if (isNaN(page) || page < 1) {
      return new NextResponse('Invalid page number', { status: 400 });
    }

    const pageUrl = `${KOMGA_API_URL}/books/${bookId}/pages/${page}`;
    console.log(`Fetching page ${page} for book ${bookId}`);
    
    const authHeaders = getAuthHeaders();
    const response = await fetch(pageUrl, {
      method: 'GET',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Komga page error ${response.status}:`, errorText);
      
      if (response.status === 404) {
        return new NextResponse('Page not found', { status: 404 });
      }

      return new NextResponse(`Failed to fetch page: ${response.status}`, { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      console.error(`Page image buffer is empty for book ${bookId}, page ${page}`);
      return new NextResponse('Page image is empty', { status: 500 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    console.log(`Successfully fetched page ${page} for book ${bookId}, size: ${imageBuffer.byteLength} bytes, type: ${contentType}`);

    // Return the image with proper headers and long cache
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching Komga page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Failed to fetch page: ${errorMessage}`, { status: 500 });
  }
});
