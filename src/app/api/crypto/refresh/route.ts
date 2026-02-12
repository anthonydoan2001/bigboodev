import { db } from '@/lib/db';
import { fetchCryptoMap, fetchCryptoInfo, fetchCryptoQuotes, retryWithBackoff, getCryptoSymbols } from '@/lib/api/crypto';
import { NextResponse } from 'next/server';
import { withAuthOrCron } from '@/lib/api-auth';
import { checkMonthlyRateLimit } from '@/lib/api/crypto-rate-limit';

// How often to refresh metadata (logos, names) - 7 days
const METADATA_REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Smart refresh endpoint that minimizes API calls:
 * 1. Only fetches CoinMarketCap IDs if not cached in DB
 * 2. Only fetches metadata (logos, names) if missing or stale (7+ days)
 * 3. Always fetches quotes (prices) - this is the only required call
 *
 * This reduces API calls from 3 per refresh to typically 1 per refresh.
 * Monthly usage: ~2,880 calls (down from ~25,920)
 */
async function handleRefresh(_request: Request, _auth: { type: 'session' | 'cron'; token: string }) {
  try {
    const cryptoSymbols = await getCryptoSymbols();

    // Proactive rate limit check - skip refresh if approaching monthly limit
    const rateLimitStatus = await checkMonthlyRateLimit();
    if (rateLimitStatus.shouldSkip) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: rateLimitStatus.reason,
        usage: rateLimitStatus.usage,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 1: Check if we have cached CMC IDs
    const existingQuotes = await db.cryptoQuote.findMany({
      select: {
        symbol: true,
        cmcId: true,
        logoUrl: true,
        metadataUpdatedAt: true,
      },
    });

    const idMap = new Map<string, number>();
    const quotesNeedingMetadata: string[] = [];
    const now = new Date();

    // Check each symbol for cached IDs and metadata freshness
    for (const quote of existingQuotes) {
      if (quote.cmcId) {
        idMap.set(quote.symbol, quote.cmcId);

        // Check if metadata needs refresh (missing logo or stale)
        const metadataAge = quote.metadataUpdatedAt
          ? now.getTime() - quote.metadataUpdatedAt.getTime()
          : Infinity;

        if (!quote.logoUrl || metadataAge > METADATA_REFRESH_INTERVAL_MS) {
          quotesNeedingMetadata.push(quote.symbol);
        }
      }
    }

    // Determine which symbols need ID lookup
    const symbolsNeedingIds = cryptoSymbols.filter(s => !idMap.has(s));

    // Only call fetchCryptoMap if we're missing IDs
    if (symbolsNeedingIds.length > 0) {
      const mapResponse = await retryWithBackoff(() => fetchCryptoMap(cryptoSymbols));

      if (!mapResponse.data || !Array.isArray(mapResponse.data)) {
        throw new Error('Invalid response format from CoinMarketCap map');
      }

      for (const coin of mapResponse.data) {
        if (cryptoSymbols.includes(coin.symbol)) {
          idMap.set(coin.symbol, coin.id);
          // New symbols always need metadata
          if (!quotesNeedingMetadata.includes(coin.symbol)) {
            quotesNeedingMetadata.push(coin.symbol);
          }
        }
      }

      // Small delay after map call
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (idMap.size === 0) {
      throw new Error('Failed to get crypto ID mappings');
    }

    const cmcIds = Array.from(idMap.values());

    // Step 2: Only fetch metadata if needed (missing logos or stale)
    let infoData: Record<string, { name?: string; logo?: string }> = {};

    if (quotesNeedingMetadata.length > 0) {
      const idsNeedingMetadata = quotesNeedingMetadata
        .map(symbol => idMap.get(symbol))
        .filter((id): id is number => id !== undefined);

      if (idsNeedingMetadata.length > 0) {
        const infoResponse = await retryWithBackoff(() => fetchCryptoInfo(idsNeedingMetadata));
        infoData = infoResponse.data || {};

        // Small delay after info call
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Step 3: Always fetch quotes (this is the main data we need)
    const quotesResponse = await retryWithBackoff(() => fetchCryptoQuotes(cmcIds));

    if (!quotesResponse.data || typeof quotesResponse.data !== 'object') {
      throw new Error('Invalid response format from CoinMarketCap quotes');
    }

    const results = [];
    const errors = [];
    const allowedSymbols = new Set(cryptoSymbols);

    // Step 4: Process and save results
    for (const [id, coinData] of Object.entries(quotesResponse.data)) {
      try {
        const symbol = coinData.symbol;

        if (!allowedSymbols.has(symbol)) {
          continue;
        }

        const quote = coinData.quote?.USD;

        if (!quote) {
          throw new Error('Missing USD quote data');
        }

        if (quote.price === null || quote.price === undefined || isNaN(quote.price)) {
          throw new Error(`Invalid price data for ${symbol}: ${quote.price}`);
        }

        // Get metadata if we fetched it
        const metadata = infoData[id];
        const needsMetadataUpdate = quotesNeedingMetadata.includes(symbol);

        // Build update data
        const updateData: {
          name: string;
          price: number;
          percentChange24h: number | null;
          lastUpdated: Date;
          cmcId: number;
          logoUrl?: string | null;
          metadataUpdatedAt?: Date;
        } = {
          name: metadata?.name || coinData.name || symbol,
          price: quote.price,
          percentChange24h: quote.percent_change_24h || null,
          lastUpdated: new Date(),
          cmcId: parseInt(id),
        };

        // Only update metadata fields if we fetched new metadata
        if (needsMetadataUpdate && metadata) {
          updateData.logoUrl = metadata.logo || null;
          updateData.metadataUpdatedAt = new Date();
        }

        await db.cryptoQuote.upsert({
          where: { symbol },
          update: updateData,
          create: {
            symbol,
            name: metadata?.name || coinData.name || symbol,
            logoUrl: metadata?.logo || null,
            price: quote.price,
            percentChange24h: quote.percent_change_24h || null,
            lastUpdated: new Date(),
            cmcId: parseInt(id),
            metadataUpdatedAt: new Date(),
          },
        });

        results.push({ symbol, name: updateData.name, price: quote.price });

        // Small delay between DB writes
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ id, symbol: coinData.symbol, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      apiCalls: {
        map: symbolsNeedingIds.length > 0,
        info: quotesNeedingMetadata.length > 0,
        quotes: true,
        total: (symbolsNeedingIds.length > 0 ? 1 : 0) + (quotesNeedingMetadata.length > 0 ? 1 : 0) + 1,
      },
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
