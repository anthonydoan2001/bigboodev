import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { searchGames, GameSearchResult } from '@/lib/api/rawg';

export const GET = withAuth(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const results: GameSearchResult[] = await searchGames(query);

    // Filter out items without images or ratings
    const filteredResults = results.filter(
      (result) => 
        result.image && 
        result.image.trim() !== '' && 
        result.rating && 
        result.rating > 0
    );

    return NextResponse.json({ results: filteredResults });
  } catch (error) {
    console.error('Game search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
});
