import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { KomgaSearchResponse } from '@/types/komga';

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
      return NextResponse.json(
        { error: 'Komga API not configured' },
        { status: 500 }
      );
    }

    // Extract seriesId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const seriesIndex = pathParts.indexOf('series');
    const seriesId = pathParts[seriesIndex + 1];
    
    if (!seriesId) {
      return NextResponse.json(
        { error: 'Series ID is required' },
        { status: 400 }
      );
    }

    // Fetch books for this series, sorted by number
    // Try multiple sort options to ensure proper ordering
    const booksUrl = `${KOMGA_API_URL}/series/${seriesId}/books?size=1000&sort=numberSort,asc`;
    
    const response = await fetch(booksUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Komga API error ${response.status}:`, errorText);
      return NextResponse.json(
        { error: `Komga API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: KomgaSearchResponse = await response.json();
    return NextResponse.json({ books: data.content || [] });
  } catch (error) {
    console.error('Error fetching series books:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch series books', details: errorMessage },
      { status: 500 }
    );
  }
});
