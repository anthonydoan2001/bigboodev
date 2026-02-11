import { MetalpriceApiResponse, CommodityQuotesResponse } from '@/types/commodities';
import { trackApiUsage } from '@/lib/api-usage';
import { db } from '@/lib/db';

const METALPRICEAPI_KEY = process.env.METALPRICEAPI_KEY || '';
const METALPRICEAPI_BASE_URL = 'https://api.metalpriceapi.com/v1';

export const MONTHLY_LIMIT = 100;
export const MIN_REFRESH_INTERVAL_HOURS = 6;

// Free tier only supports precious metals (XIN, XLI, XU, NATURALGAS require paid plan)
export const COMMODITY_SYMBOLS = ['XAU', 'XAG', 'XPT'] as const;

export const COMMODITY_META: Record<string, { name: string; unit: string }> = {
  XAU: { name: 'Gold', unit: 'Troy Ounce' },
  XAG: { name: 'Silver', unit: 'Troy Ounce' },
  XPT: { name: 'Platinum', unit: 'Troy Ounce' },
};

/**
 * Sleep utility for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.message.includes('429') || lastError.message.includes('RATE_LIMIT')) {
        const delay = initialDelay * Math.pow(2, attempt) * 2;
        await sleep(delay);
        continue;
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Check how many MetalpriceAPI calls have been made this calendar month.
 * Returns { used, warning } where warning is true if >= 85 calls used.
 */
export async function checkMonthlyBudget(): Promise<{ used: number; warning: boolean }> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const count = await db.apiUsage.count({
      where: {
        apiName: 'metalpriceapi',
        success: true,
        timestamp: { gte: monthStart },
      },
    });

    return {
      used: count,
      warning: count >= 85,
    };
  } catch {
    // If apiUsage table doesn't exist yet, assume 0
    return { used: 0, warning: false };
  }
}

/**
 * Single gatekeeper: determines whether a refresh is allowed.
 * Checks both monthly budget AND minimum time since last refresh.
 */
export async function canRefresh(): Promise<{ allowed: boolean; reason?: string; nextRefreshAt?: string }> {
  // Check monthly budget
  const budget = await checkMonthlyBudget();
  if (budget.used >= 95) {
    return {
      allowed: false,
      reason: `Monthly budget nearly exhausted (${budget.used}/${MONTHLY_LIMIT} calls used). Blocking to preserve buffer.`,
    };
  }

  // Check time since last refresh
  try {
    const latestQuote = await db.commodityQuote.findFirst({
      orderBy: { lastUpdated: 'desc' },
    });

    if (latestQuote) {
      const hoursSinceUpdate = (Date.now() - latestQuote.lastUpdated.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < MIN_REFRESH_INTERVAL_HOURS) {
        const nextRefresh = new Date(latestQuote.lastUpdated.getTime() + MIN_REFRESH_INTERVAL_HOURS * 60 * 60 * 1000);
        return {
          allowed: false,
          reason: `Last refresh was ${hoursSinceUpdate.toFixed(1)}h ago. Minimum interval is ${MIN_REFRESH_INTERVAL_HOURS}h.`,
          nextRefreshAt: nextRefresh.toISOString(),
        };
      }
    }
  } catch {
    // If table doesn't exist yet, allow refresh (first run)
  }

  if (budget.warning) {
    console.warn(`[MetalpriceAPI] Budget warning: ${budget.used}/${MONTHLY_LIMIT} calls used this month`);
  }

  return { allowed: true };
}

/**
 * Fetch commodity prices from MetalpriceAPI.
 * Returns USD prices (converted from inverse rates).
 */
export async function fetchCommodityPrices(): Promise<MetalpriceApiResponse> {
  if (!METALPRICEAPI_KEY) {
    throw new Error('METALPRICEAPI_KEY is not set');
  }

  const symbols = COMMODITY_SYMBOLS.join(',');
  const url = `${METALPRICEAPI_BASE_URL}/latest?api_key=${METALPRICEAPI_KEY}&base=USD&currencies=${symbols}`;

  const response = await fetch(url, { cache: 'no-store' });

  const isSuccess = response.ok && response.status !== 429;
  await trackApiUsage('metalpriceapi', {
    endpoint: '/latest',
    success: isSuccess,
    statusCode: response.status,
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch commodity prices: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`MetalpriceAPI error: ${JSON.stringify(data)}`);
  }

  if (!data.rates || typeof data.rates !== 'object') {
    throw new Error('MetalpriceAPI returned invalid response: missing rates');
  }

  return data;
}

/**
 * Convert an inverse rate to USD price.
 * MetalpriceAPI returns rates as inverse: price = 1 / rate
 */
export function inverseRateToUsd(rate: number): number {
  if (rate === 0) return 0;
  return 1 / rate;
}

/**
 * Extract the rate for a symbol from the API response.
 * The API returns both "XAU" (inverse) and "USDXAU" (direct USD price) keys.
 * We prefer the "USD{symbol}" key (direct price) if available, otherwise invert.
 */
export function extractUsdPrice(rates: Record<string, number>, symbol: string): number {
  const directKey = `USD${symbol}`;
  if (directKey in rates && rates[directKey] > 0) {
    return rates[directKey];
  }
  if (symbol in rates && rates[symbol] > 0) {
    return inverseRateToUsd(rates[symbol]);
  }
  return 0;
}

/**
 * Client-side: fetch commodity quotes from the database via API route.
 */
export async function fetchCommodityQuotesFromDB(): Promise<CommodityQuotesResponse> {
  const response = await fetch('/api/commodities', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch commodity quotes');
  }
  return response.json();
}
