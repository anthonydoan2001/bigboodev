import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * API route to fetch crypto quotes from the database
 * Frontend should use this instead of calling CoinMarketCap directly
 */
export async function GET() {
  try {
    const quotes = await db.cryptoQuote.findMany({
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
      quotes: quotes.map(q => ({
        symbol: q.symbol,
        name: q.name,
        logoUrl: q.logoUrl,
        price: q.price,
        percentChange24h: q.percentChange24h,
        lastUpdated: q.lastUpdated.toISOString(),
      })),
      lastUpdated: lastUpdated.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching crypto quotes:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch crypto quotes',
      },
      { status: 500 }
    );
  }
});
