import { FinnhubQuoteResponse, StockQuotesResponse, FinnhubCompanyProfile } from '@/types/stocks';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd5hhjthr01qqequ2hnigd5hhjthr01qqequ2hnj0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const STOCKS_TO_TRACK = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META'];

// Log API key status (without exposing the full key)
if (!process.env.FINNHUB_API_KEY) {
  console.warn('⚠️  FINNHUB_API_KEY not found in environment variables, using fallback key');
} else {
  console.log('✅ Using FINNHUB_API_KEY from environment variables');
}

export const STOCK_SYMBOLS = STOCKS_TO_TRACK;

/**
 * Fetches company profile (including logo) from Finnhub API
 */
export async function fetchCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile | null> {
  const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (response.status === 429) {
      console.warn(`Rate limit hit for company profile ${symbol}`);
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Failed to fetch company profile for ${symbol}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return null;
    }

    const data = await response.json();
    
    // Check if API returned an error object
    if (data.error) {
      console.warn(`Finnhub API error for ${symbol} profile:`, data.error);
      return null;
    }

    // Validate that we got the expected data
    if (!data.name || !data.logo) {
      console.warn(`Incomplete profile data for ${symbol}:`, {
        hasName: !!data.name,
        hasLogo: !!data.logo,
      });
    }

    console.log(`Successfully fetched profile for ${symbol}:`, {
      name: data.name,
      hasLogo: !!data.logo,
    });

    return data;
  } catch (error) {
    console.error(`Error fetching company profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetches a single stock quote from Finnhub API
 */
export async function fetchStockQuote(symbol: string): Promise<FinnhubQuoteResponse> {
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Finnhub API error for ${symbol}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to fetch quote for ${symbol}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if API returned an error object
    if (data.error) {
      throw new Error(`Finnhub API error: ${data.error}`);
    }

    // Check if response is empty or invalid (Finnhub returns {c: 0, d: 0, ...} when no data)
    // Only check current price (c) being 0, as other values can legitimately be 0
    if (data.c === 0 && data.pc === 0) {
      console.warn(`Warning: Received zero values for ${symbol} - market may be closed or symbol invalid`);
      // Don't throw error, just log warning - let it proceed as API might return zeros when market is closed
    }

    // Validate required fields exist
    if (typeof data.c !== 'number' || typeof data.d !== 'number' || typeof data.dp !== 'number') {
      throw new Error(`Invalid response format for ${symbol}`);
    }

    return data;
  } catch (error) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error fetching quote for ${symbol}: ${String(error)}`);
  }
}

/**
 * Fetches stock quotes from the database (via API route)
 */
export async function fetchStockQuotes(): Promise<StockQuotesResponse> {
  const response = await fetch('/api/stocks');
  if (!response.ok) {
    throw new Error('Failed to fetch stock quotes');
  }
  return response.json();
}

/**
 * Checks if current time is within market hours (9:30 AM - 4:00 PM ET)
 */
export function isMarketHours(): boolean {
  const now = new Date();
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  // Check if it's a weekday (Monday-Friday)
  const dayOfWeek = etTime.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  return isWeekday && timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

/**
 * Sleep utility for retry logic
 */
export function sleep(ms: number): Promise<void> {
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
      
      // If it's a rate limit error, wait longer
      if (lastError.message === 'RATE_LIMIT_EXCEEDED') {
        const delay = initialDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      
      // For other errors, also retry with backoff
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
