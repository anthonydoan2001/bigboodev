import {
  CoinMarketCapMapResponse,
  CoinMarketCapInfoResponse,
  CoinMarketCapQuoteResponse,
  CryptoQuotesResponse,
} from '@/types/crypto';

const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY || '';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL'];

export const CRYPTO_SYMBOLS_TO_TRACK = CRYPTO_SYMBOLS;

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
      if (lastError.message.includes('429') || lastError.message.includes('RATE_LIMIT')) {
        const delay = initialDelay * Math.pow(2, attempt) * 2; // Longer delay for rate limits
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

/**
 * Fetches CoinMarketCap ID mapping for crypto symbols
 * Filters to get the main/active coin for each symbol (handles duplicates)
 */
export async function fetchCryptoMap(): Promise<CoinMarketCapMapResponse> {
  if (!CMC_API_KEY) {
    throw new Error('COINMARKETCAP_API_KEY is not set');
  }

  const url = `${CMC_BASE_URL}/v1/cryptocurrency/map?symbol=${CRYPTO_SYMBOLS.join(',')}`;
  
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
    },
    cache: 'no-store',
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch crypto map: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.status?.error_code && data.status.error_code !== 0) {
    throw new Error(`CoinMarketCap API error: ${data.status.error_message || 'Unknown error'}`);
  }

  // Filter to get the main coin for each symbol
  // Priority: 1) Lower ID (higher rank), 2) Active status preferred but allow inactive if no active exists
  if (data.data && Array.isArray(data.data)) {
    const symbolMap = new Map<string, typeof data.data[0]>();
    
    for (const coin of data.data) {
      const existing = symbolMap.get(coin.symbol);
      if (!existing) {
        symbolMap.set(coin.symbol, coin);
      } else {
        // Prefer active coins, then lower ID (higher rank/more established)
        const coinIsActive = coin.is_active === 1;
        const existingIsActive = existing.is_active === 1;
        
        if (coinIsActive && !existingIsActive) {
          symbolMap.set(coin.symbol, coin);
        } else if (coinIsActive === existingIsActive && coin.id < existing.id) {
          symbolMap.set(coin.symbol, coin);
        }
      }
    }
    
    data.data = Array.from(symbolMap.values());
  }

  return data;
}

/**
 * Fetches cryptocurrency metadata (logo, name, description)
 */
export async function fetchCryptoInfo(cmcIds: number[]): Promise<CoinMarketCapInfoResponse> {
  if (!CMC_API_KEY) {
    throw new Error('COINMARKETCAP_API_KEY is not set');
  }

  const ids = cmcIds.join(',');
  const url = `${CMC_BASE_URL}/v2/cryptocurrency/info?id=${ids}`;
  
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
    },
    cache: 'no-store',
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch crypto info: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.status?.error_code && data.status.error_code !== 0) {
    throw new Error(`CoinMarketCap API error: ${data.status.error_message || 'Unknown error'}`);
  }

  return data;
}

/**
 * Fetches latest cryptocurrency quotes (prices, changes, etc.)
 */
export async function fetchCryptoQuotes(cmcIds: number[]): Promise<CoinMarketCapQuoteResponse> {
  if (!CMC_API_KEY) {
    throw new Error('COINMARKETCAP_API_KEY is not set');
  }

  const ids = cmcIds.join(',');
  const url = `${CMC_BASE_URL}/v2/cryptocurrency/quotes/latest?id=${ids}`;
  
  const response = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
    },
    cache: 'no-store',
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch crypto quotes: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.status?.error_code && data.status.error_code !== 0) {
    throw new Error(`CoinMarketCap API error: ${data.status.error_message || 'Unknown error'}`);
  }

  return data;
}

/**
 * Fetches crypto quotes from the database (via API route)
 */
export async function fetchCryptoQuotesFromDB(): Promise<CryptoQuotesResponse> {
  const response = await fetch('/api/crypto');
  if (!response.ok) {
    throw new Error('Failed to fetch crypto quotes');
  }
  return response.json();
}
