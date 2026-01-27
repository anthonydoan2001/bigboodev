import { db } from '@/lib/db';
import { fetchCryptoMap, fetchCryptoInfo, fetchCryptoQuotes, retryWithBackoff } from '@/lib/api/crypto';
import { NextResponse } from 'next/server';
import { withAuthOrCron } from '@/lib/api-auth';

/**
 * Single refresh endpoint that updates everything:
 * 1. Fetches CoinMarketCap IDs (if needed)
 * 2. Fetches metadata (logos, names)
 * 3. Fetches quotes (prices, changes)
 *
 * Should be run every 5 minutes
 */
async function handleRefresh(_request: Request, _auth: { type: 'session' | 'cron'; token: string }) {
  try {
    void 0; //(`[Crypto Refresh] Called by ${auth.type} at ${new Date().toISOString()}`);
    
    // Step 1: Get or create ID mappings
    const existingIds = await db.cryptoQuote.findMany({
      select: { symbol: true },
    });
    
    const existingSymbols = new Set(existingIds.map(c => c.symbol));
    const needsSetup = existingSymbols.size === 0;

    const idMap = new Map<string, number>();

    if (needsSetup) {
      void 0; //('Setting up crypto IDs...');
      const mapResponse = await retryWithBackoff(() => fetchCryptoMap());
      
      if (!mapResponse.data || !Array.isArray(mapResponse.data)) {
        throw new Error('Invalid response format from CoinMarketCap map');
      }

      for (const coin of mapResponse.data) {
        idMap.set(coin.symbol, coin.id);
      }
    } else {
      // Get IDs from existing quotes or fetch map for new symbols
      const mapResponse = await retryWithBackoff(() => fetchCryptoMap());
      if (mapResponse.data && Array.isArray(mapResponse.data)) {
        for (const coin of mapResponse.data) {
          idMap.set(coin.symbol, coin.id);
        }
      }
    }

    if (idMap.size === 0) {
      throw new Error('Failed to get crypto ID mappings');
    }

    const cmcIds = Array.from(idMap.values());
    void 0; //(`Processing ${cmcIds.length} cryptos...`);

    // Step 2: Fetch metadata (logos, names) - with delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
    void 0; //('Fetching metadata...');
    const infoResponse = await retryWithBackoff(() => fetchCryptoInfo(cmcIds));

    // Step 3: Fetch quotes (prices, changes) - with delay
    await new Promise(resolve => setTimeout(resolve, 200));
    void 0; //('Fetching quotes...');
    const quotesResponse = await retryWithBackoff(() => fetchCryptoQuotes(cmcIds));

    if (!quotesResponse.data || typeof quotesResponse.data !== 'object') {
      throw new Error('Invalid response format from CoinMarketCap quotes');
    }

    const results = [];
    const errors = [];

    // Step 4: Combine and save everything to single table
    // Only process BTC, ETH, SOL
    const allowedSymbols = new Set(['BTC', 'ETH', 'SOL']);
    
    for (const [id, coinData] of Object.entries(quotesResponse.data)) {
      try {
        const symbol = coinData.symbol;
        
        // Skip if not in allowed symbols
        if (!allowedSymbols.has(symbol)) {
          void 0; //(`Skipping ${symbol} - not in allowed list (BTC, ETH, SOL)`);
          continue;
        }
        
        // Get metadata for this coin
        const metadata = infoResponse.data?.[id];
        const quote = coinData.quote?.USD;
        
        if (!quote) {
          throw new Error('Missing USD quote data');
        }

        // Validate price exists and is a valid number
        if (quote.price === null || quote.price === undefined || isNaN(quote.price)) {
          throw new Error(`Invalid price data for ${symbol}: ${quote.price}`);
        }

        // Upsert everything in one table
        await db.cryptoQuote.upsert({
          where: { symbol },
          update: {
            name: metadata?.name || coinData.name || symbol,
            logoUrl: metadata?.logo || null,
            price: quote.price,
            percentChange24h: quote.percent_change_24h || null,
            lastUpdated: new Date(),
          },
          create: {
            symbol,
            name: metadata?.name || coinData.name || symbol,
            logoUrl: metadata?.logo || null,
            price: quote.price,
            percentChange24h: quote.percent_change_24h || null,
            lastUpdated: new Date(),
          },
        });

        results.push({ symbol, name: metadata?.name || coinData.name || symbol, price: quote.price });
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ id, symbol: coinData.symbol, error: errorMessage });
        void 0; //(`Failed to save quote for ${coinData.symbol}:`, errorMessage);
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

// Export with auth in production, bypass in development
export const GET = process.env.NODE_ENV === 'development'
  ? async (request: Request) => handleRefresh(request, { type: 'cron', token: 'dev' })
  : withAuthOrCron(handleRefresh);
