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

export const GET = withAuth(async (request: NextRequest) => {
  try {
    if (!KOMGA_API_URL || !KOMGA_USERNAME || !KOMGA_PASSWORD) {
      return NextResponse.json(
        { error: 'Komga API not configured. Please set KOMGA_API_URL, KOMGA_USERNAME, and KOMGA_PASSWORD environment variables.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || '';
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    // Build URL with query params (excluding our internal 'endpoint' param)
    const url = new URL(`${KOMGA_API_URL}/${endpoint}`);
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Komga API error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Komga authentication failed. Please check your credentials.' },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Komga API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Komga API:', error);
    
    if (error instanceof Error && error.message.includes('credentials')) {
      return NextResponse.json(
        { error: 'Komga credentials not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch from Komga API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});
