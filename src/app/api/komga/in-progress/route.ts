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

    // Fetch books with IN_PROGRESS read status
    const url = `${KOMGA_API_URL}/books?read_status=IN_PROGRESS&sort=readDate,desc`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Komga API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Komga API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: KomgaSearchResponse = await response.json();
    return NextResponse.json({ books: data.content || [] });
  } catch (error) {
    console.error('Error fetching in-progress books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch in-progress books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
