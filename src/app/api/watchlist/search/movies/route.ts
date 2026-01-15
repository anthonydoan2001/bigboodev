import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { trackApiUsage } from '@/lib/api-usage';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const GET = withAuth(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key is missing' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`,
      { cache: 'no-store' }
    );

    const isSuccess = response.ok && response.status !== 429;
    await trackApiUsage('tmdb', {
      endpoint: '/search/movie',
      success: isSuccess,
      statusCode: response.status,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from TMDB');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('TMDB API Error:', error);
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 });
  }
});




