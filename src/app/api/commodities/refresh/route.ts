import { db } from '@/lib/db';
import {
  canRefresh,
  fetchCommodityPrices,
  extractUsdPrice,
  retryWithBackoff,
  COMMODITY_SYMBOLS,
  COMMODITY_META,
  checkMonthlyBudget,
  MONTHLY_LIMIT,
  MIN_REFRESH_INTERVAL_HOURS,
} from '@/lib/api/commodities';
import { NextResponse } from 'next/server';
import { withAuthOrCron } from '@/lib/api-auth';

/**
 * API route to refresh commodity quotes from MetalpriceAPI
 * Called by cron job every 8 hours or manually by authenticated users
 *
 * Budget: 100 requests/month free tier
 * Schedule: Every 8 hours (3x/day = ~90/month with 10 buffer)
 */
async function handleRefresh(request: Request, auth: { type: 'session' | 'cron'; token: string }) {
  try {
    // Check for force parameter (for manual testing)
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    // ALWAYS check budget - even in dev mode and with force flag
    const refreshCheck = await canRefresh();
    if (!refreshCheck.allowed && !force) {
      // Return cached data instead
      const cachedQuotes = await db.commodityQuote.findMany({
        orderBy: { symbol: 'asc' },
      });
      const budget = await checkMonthlyBudget();

      return NextResponse.json({
        success: true,
        skipped: true,
        reason: refreshCheck.reason,
        nextRefreshAt: refreshCheck.nextRefreshAt,
        budgetUsed: budget.used,
        budgetRemaining: MONTHLY_LIMIT - budget.used,
        cached: cachedQuotes.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Even with force, block if budget is truly exhausted (>= 95)
    if (force) {
      const budget = await checkMonthlyBudget();
      if (budget.used >= 95) {
        return NextResponse.json({
          success: false,
          error: `Monthly budget exhausted (${budget.used}/${MONTHLY_LIMIT}). Cannot refresh even with force flag.`,
          budgetUsed: budget.used,
          budgetRemaining: MONTHLY_LIMIT - budget.used,
          timestamp: new Date().toISOString(),
        }, { status: 429 });
      }
    }

    // Fetch prices from MetalpriceAPI (1 call for all commodities)
    const apiResponse = await retryWithBackoff(() => fetchCommodityPrices());

    const results = [];
    const errors = [];

    for (const symbol of COMMODITY_SYMBOLS) {
      try {
        const usdPrice = extractUsdPrice(apiResponse.rates, symbol);
        if (usdPrice === 0) {
          errors.push({ symbol, error: `No rate returned for ${symbol}` });
          continue;
        }
        const meta = COMMODITY_META[symbol];

        // Get existing record for change calculation
        const existing = await db.commodityQuote.findUnique({
          where: { symbol },
        });

        let dailyChange: number | null = null;
        let percentChange: number | null = null;

        if (existing && existing.price > 0) {
          dailyChange = usdPrice - existing.price;
          percentChange = (dailyChange / existing.price) * 100;
        }

        await db.commodityQuote.upsert({
          where: { symbol },
          update: {
            name: meta.name,
            price: usdPrice,
            unit: meta.unit,
            dailyChange,
            percentChange,
            previousPrice: existing?.price ?? null,
            lastUpdated: new Date(),
          },
          create: {
            symbol,
            name: meta.name,
            price: usdPrice,
            unit: meta.unit,
            dailyChange,
            percentChange,
            previousPrice: null,
            lastUpdated: new Date(),
          },
        });

        results.push({ symbol, success: true, price: usdPrice });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ symbol, error: errorMessage });
      }
    }

    const budget = await checkMonthlyBudget();
    const nextRefreshAt = new Date(Date.now() + MIN_REFRESH_INTERVAL_HOURS * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      budgetUsed: budget.used,
      budgetRemaining: MONTHLY_LIMIT - budget.used,
      nextRefreshAt: nextRefreshAt.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with auth in production, bypass auth (NOT budget) in development
export const GET = process.env.NODE_ENV === 'development'
  ? async (request: Request) => handleRefresh(request, { type: 'cron', token: 'dev' })
  : withAuthOrCron(handleRefresh);
