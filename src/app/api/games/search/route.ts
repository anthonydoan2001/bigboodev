import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { RawgSearchResponse, transformRawgGame } from '@/types/games';

const RAWG_API_URL = 'https://api.rawg.io/api';

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [], count: 0 });
    }

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      console.error('RAWG_API_KEY not configured');
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const url = `${RAWG_API_URL}/games?key=${apiKey}&search=${encodeURIComponent(query.trim())}&page=${page}&page_size=40`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log API usage
    await db.apiUsage.create({
      data: {
        apiName: 'rawg',
        endpoint: '/games',
        success: response.ok,
        statusCode: response.status,
      }
    }).catch(err => console.error('Failed to log API usage:', err));

    if (!response.ok) {
      console.error('RAWG API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to search games' }, { status: response.status });
    }

    const data: RawgSearchResponse = await response.json();

    // Transform and filter results (exclude games without cover images)
    const results = data.results
      .filter(game => game.background_image && game.rating > 0)
      .map(transformRawgGame);

    return NextResponse.json({
      results,
      count: data.count,
      next: data.next,
      previous: data.previous,
    });
  } catch (error) {
    console.error('Error searching games:', error);
    return NextResponse.json({
      error: 'Failed to search games',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});
