import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { KomgaSearchResponse, KomgaLibrary } from '@/types/komga';

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

    // Fetch all libraries
    const librariesUrl = `${KOMGA_API_URL}/libraries`;
    const librariesResponse = await fetch(librariesUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!librariesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch libraries' },
        { status: librariesResponse.status }
      );
    }

    const libraries: KomgaLibrary[] = await librariesResponse.json();
    
    // Fetch all books to get counts
    const booksUrl = `${KOMGA_API_URL}/books?size=1`; // Just get total count
    const booksResponse = await fetch(booksUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!booksResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: booksResponse.status }
      );
    }

    const booksData: KomgaSearchResponse = await booksResponse.json();
    
    // Fetch unread books count
    const unreadUrl = `${KOMGA_API_URL}/books?read_status=UNREAD&size=1`;
    const unreadResponse = await fetch(unreadUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const unreadData: KomgaSearchResponse = unreadResponse.ok 
      ? await unreadResponse.json()
      : { totalElements: 0 } as KomgaSearchResponse;

    // Fetch in-progress books count
    const inProgressUrl = `${KOMGA_API_URL}/books?read_status=IN_PROGRESS&size=1`;
    const inProgressResponse = await fetch(inProgressUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const inProgressData: KomgaSearchResponse = inProgressResponse.ok
      ? await inProgressResponse.json()
      : { totalElements: 0 } as KomgaSearchResponse;

    // Fetch all series
    const seriesUrl = `${KOMGA_API_URL}/series?size=1`;
    const seriesResponse = await fetch(seriesUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const seriesData = seriesResponse.ok 
      ? await seriesResponse.json()
      : { totalElements: 0 };

    return NextResponse.json({
      totalBooks: booksData.totalElements || 0,
      totalSeries: seriesData.totalElements || 0,
      unreadBooks: unreadData.totalElements || 0,
      inProgressBooks: inProgressData.totalElements || 0,
    });
  } catch (error) {
    console.error('Error fetching library stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
