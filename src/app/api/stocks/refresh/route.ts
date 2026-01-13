import { db } from '@/lib/db';
import { fetchStockQuote, fetchCompanyProfile, retryWithBackoff, STOCK_SYMBOLS, isMarketHours } from '@/lib/api/stocks';
import { NextResponse } from 'next/server';

/**
 * API route to refresh stock quotes from Finnhub API
 * This should be called by a cron job or scheduled task
 * 
 * Refresh frequency:
 * - During market hours (9:30 AM - 4:00 PM ET, Mon-Fri): Every 5 minutes
 * - Outside market hours: Every hour
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Verify cron secret if set (for Vercel Cron)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for force parameter (for manual testing)
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    // Check if we should refresh based on market hours
    // Always refresh if no data exists, force is true, or follow market hours logic
    const hasData = await db.stockQuote.count() > 0;
    const shouldRefresh = force || !hasData || isMarketHours() || await shouldRefreshOutsideMarketHours();
    
    if (!shouldRefresh) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Outside market hours - will refresh hourly. Add ?force=true to bypass.',
        timestamp: new Date().toISOString(),
      });
    }

    const results = [];
    const errors = [];

    // Fetch all stocks with retry logic
    for (const symbol of STOCK_SYMBOLS) {
      try {
        console.log(`Fetching quote for ${symbol}...`);
        const quote = await retryWithBackoff(() => fetchStockQuote(symbol));
        
        // Small delay before fetching profile to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch company profile (logo and name) - don't fail if this fails
        console.log(`Fetching company profile for ${symbol}...`);
        const profile = await fetchCompanyProfile(symbol);
        
        console.log(`Successfully fetched ${symbol}:`, {
          current: quote.c,
          change: quote.d,
          percentChange: quote.dp,
          hasProfile: !!profile,
          companyName: profile?.name || 'N/A',
          hasLogo: !!profile?.logo,
        });
        
        // Upsert the quote in the database
        await db.stockQuote.upsert({
          where: { symbol },
          update: {
            companyName: profile?.name || null,
            logoUrl: profile?.logo || null,
            currentPrice: quote.c,
            change: quote.d,
            percentChange: quote.dp,
            lastUpdated: new Date(),
          },
          create: {
            symbol,
            companyName: profile?.name || null,
            logoUrl: profile?.logo || null,
            currentPrice: quote.c,
            change: quote.d,
            percentChange: quote.dp,
            lastUpdated: new Date(),
          },
        });

        results.push({ 
          symbol, 
          success: true,
          hasProfile: !!profile,
          companyName: profile?.name || null,
        });
        
        // Small delay between requests to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ symbol, error: errorMessage });
        console.error(`Failed to fetch quote for ${symbol}:`, errorMessage);
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing stock quotes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});

/**
 * Check if we should refresh outside market hours
 * Refresh once per hour outside market hours
 */
async function shouldRefreshOutsideMarketHours(): Promise<boolean> {
  // Get the most recent update
  const latestQuote = await db.stockQuote.findFirst({
    orderBy: { lastUpdated: 'desc' },
  });

  if (!latestQuote) {
    // No data exists, refresh
    return true;
  }

  // Check if last update was more than 1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return latestQuote.lastUpdated < oneHourAgo;
}
