import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuthOrCron } from '@/lib/api-auth';

const GASBUDDY_STATION_ID = '199615';
const GASBUDDY_STATION_NAME = 'Costco Cypress';
const GASBUDDY_URL = `https://www.gasbuddy.com/station/${GASBUDDY_STATION_ID}`;

/**
 * Scrape gas price from GasBuddy station page
 */
async function scrapeGasPrice(): Promise<number> {
  const response = await fetch(GASBUDDY_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GasBuddy returned ${response.status}`);
  }

  const html = await response.text();

  // Check for Cloudflare block
  if (html.includes('Attention Required') || html.includes('cf-browser-verification')) {
    throw new Error('CLOUDFLARE_BLOCKED');
  }

  // Strategy 1: Find the full Station:199615 block, then extract regular_gas price from its prices array
  const stationBlockStart = html.indexOf(`"Station:${GASBUDDY_STATION_ID}":{"__typename":"Station"`);
  if (stationBlockStart !== -1) {
    const pricesStart = html.indexOf('"prices":[', stationBlockStart);
    if (pricesStart !== -1 && pricesStart - stationBlockStart < 5000) {
      // Price comes BEFORE fuelProduct in the JSON structure
      const pricesChunk = html.substring(pricesStart, pricesStart + 1000);
      const regularMatch = pricesChunk.match(/"price":(\d+\.?\d*),"formattedPrice":"\$[^"]*"}\s*,\s*"fuelProduct"\s*:\s*"regular_gas"/);
      if (regularMatch) {
        return parseFloat(regularMatch[1]);
      }
    }
  }

  // Strategy 2: Search globally for price before regular_gas, scoped near "id":"199615"
  const idRef = html.indexOf(`"id":"${GASBUDDY_STATION_ID}"`);
  if (idRef !== -1) {
    // Prices array is within ~2000 chars after the id field
    const nearbyHtml = html.substring(Math.max(0, idRef - 2000), idRef + 2000);
    const nearbyMatch = nearbyHtml.match(/"price":(\d+\.?\d*),"formattedPrice":"\$[^"]*"}\s*,\s*"fuelProduct"\s*:\s*"regular_gas"/);
    if (nearbyMatch) {
      return parseFloat(nearbyMatch[1]);
    }
  }

  // Strategy 3: First dollar amount on the page as last resort
  const anyPriceMatch = html.match(/\$(\d+\.\d{2})/);
  if (anyPriceMatch) {
    return parseFloat(anyPriceMatch[1]);
  }

  throw new Error('Could not parse gas price from page');
}

async function handleGet(request: Request, auth: { type: 'session' | 'cron'; token: string }) {
  try {
    // Cron call: scrape and store
    if (auth.type === 'cron') {
      const price = await scrapeGasPrice();
      const now = new Date();

      await db.gasPrice.upsert({
        where: { stationId: GASBUDDY_STATION_ID },
        update: {
          regular: price,
          scrapedAt: now,
          lastUpdated: now,
        },
        create: {
          stationId: GASBUDDY_STATION_ID,
          station: GASBUDDY_STATION_NAME,
          regular: price,
          scrapedAt: now,
          lastUpdated: now,
        },
      });

      return NextResponse.json({
        gasPrice: {
          station: GASBUDDY_STATION_NAME,
          stationId: GASBUDDY_STATION_ID,
          regular: price,
          scrapedAt: now.toISOString(),
        },
      });
    }

    // Session call: return cached data
    const cached = await db.gasPrice.findUnique({
      where: { stationId: GASBUDDY_STATION_ID },
    });

    if (!cached) {
      return NextResponse.json({ gasPrice: null });
    }

    return NextResponse.json({
      gasPrice: {
        station: cached.station,
        stationId: cached.stationId,
        regular: cached.regular,
        scrapedAt: cached.scrapedAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'CLOUDFLARE_BLOCKED') {
      return NextResponse.json(
        { gasPrice: null, error: 'GasBuddy blocked by Cloudflare' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { gasPrice: null, error: message },
      { status: 500 }
    );
  }
}

export const GET = process.env.NODE_ENV === 'development'
  ? async (request: Request) => handleGet(request, { type: 'cron', token: 'dev' })
  : withAuthOrCron(handleGet);
