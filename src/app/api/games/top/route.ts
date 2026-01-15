import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

export interface TopGame {
  id: string;
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  externalId: number;
}

/**
 * API route to fetch top games from database
 * Data is refreshed daily via cron job at /api/games/top/refresh
 */
export const GET = withAuth(async () => {
  try {
    // Check if topGame model exists (for debugging)
    if (!('topGame' in db)) {
      console.error('Prisma client missing topGame model. Please restart dev server after running: npx prisma generate');
      return NextResponse.json({ 
        error: 'Database model not available. Please restart the dev server.',
        hint: 'Run: npx prisma generate && restart dev server'
      }, { status: 500 });
    }

    // Fetch top games from database
    const topGames = await db.topGame.findMany({
      orderBy: [
        { rating: 'desc' },
      ],
    });

    // Convert to API format
    const results: TopGame[] = topGames.map(item => ({
      id: item.id,
      title: item.title,
      image: item.imageUrl,
      year: item.released ? new Date(item.released).getFullYear() : null,
      rating: item.rating,
      externalId: item.externalId,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Top games fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch top games',
      details: errorMessage,
      hint: errorMessage.includes('topGame') ? 'Please restart the dev server after running: npx prisma generate' : undefined
    }, { status: 500 });
  }
});
