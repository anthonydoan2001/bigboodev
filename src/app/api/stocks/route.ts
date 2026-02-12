import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { getStockSymbols } from '@/lib/api/stocks';

/**
 * API route to fetch stock quotes from the database
 * Frontend should use this instead of calling Finnhub directly
 */
export const GET = withAuth(async () => {
  try {
    const configuredSymbols = await getStockSymbols();
    const quotes = await db.stockQuote.findMany({
      where: { symbol: { in: configuredSymbols } },
      orderBy: { symbol: 'asc' },
    });

    // Get the most recent update timestamp
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
    console.error('Error fetching stock quotes:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch stock quotes',
      },
      { status: 500 }
    );
  }
});
