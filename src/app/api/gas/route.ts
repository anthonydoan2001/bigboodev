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

  // Strategy 1: Look for dollar amount after "Regular" label
  const regularMatch = html.match(/Regular[\s\S]{0,300}?\$(\d+\.\d{2})/i);
  if (regularMatch) {
    return parseFloat(regularMatch[1]);
  }

  // Strategy 2: Look for price near "FuelTypePriceDisplay" class
  const fuelTypeMatch = html.match(/FuelTypePriceDisplay[\s\S]{0,200}?\$(\d+\.\d{2})/i);
  if (fuelTypeMatch) {
    return parseFloat(fuelTypeMatch[1]);
  }

  // Strategy 3: Look in "Station Prices" section
  const stationPricesMatch = html.match(/Station\s*Prices[\s\S]{0,500}?\$(\d+\.\d{2})/i);
  if (stationPricesMatch) {
    return parseFloat(stationPricesMatch[1]);
  }

  // Strategy 4: First dollar amount on the page as last resort
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
