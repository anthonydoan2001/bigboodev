import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export interface TopItem {
  id: string;
  type: 'anime' | 'movie' | 'show';
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  episodes?: number | null;
  externalId: number;
}

/**
 * API route to fetch top items from database
 * Data is refreshed daily via cron job at /api/watchlist/top/refresh
 */
export async function GET() {
  try {
    // Check if topItem model exists (for debugging)
    if (!('topItem' in db)) {
      console.error('Prisma client missing topItem model. Please restart dev server after running: npx prisma generate');
      return NextResponse.json({ 
        error: 'Database model not available. Please restart the dev server.',
        hint: 'Run: npx prisma generate && restart dev server'
      }, { status: 500 });
    }

    // Fetch top items from database
    const topItems = await db.topItem.findMany({
      orderBy: [
        { type: 'asc' },
        { rating: 'desc' },
      ],
    });

    // Convert to API format
    const results: TopItem[] = topItems.map(item => ({
      id: item.id,
      type: item.type as 'anime' | 'movie' | 'show',
      title: item.title,
      image: item.imageUrl,
      year: item.year,
      rating: item.rating,
      episodes: item.episodes,
      externalId: item.externalId,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Top items fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch top items',
      details: errorMessage,
      hint: errorMessage.includes('topItem') ? 'Please restart the dev server after running: npx prisma generate' : undefined
    }, { status: 500 });
  }
});

