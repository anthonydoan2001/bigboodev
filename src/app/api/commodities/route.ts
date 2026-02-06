import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

/**
 * API route to fetch commodity quotes from the database
 * Frontend should use this instead of calling MetalpriceAPI directly
 */
export const GET = withAuth(async () => {
  try {
    const quotes = await db.commodityQuote.findMany({
      orderBy: { symbol: 'asc' },
    });

    const lastUpdated = quotes.length > 0
      ? quotes.reduce((latest, quote) =>
          quote.lastUpdated > latest ? quote.lastUpdated : latest,
          quotes[0].lastUpdated
        )
      : new Date();

    return NextResponse.json({
      quotes,
      lastUpdated: lastUpdated.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching commodity quotes:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch commodity quotes',
      },
      { status: 500 }
    );
  }
});
