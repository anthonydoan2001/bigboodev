/**
 * Simple in-memory TTL cache for API responses
 * Used for frequently accessed, rarely changing data like folders and tags
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached data if it exists and hasn't expired
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set data in cache with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttlMs Time to live in milliseconds (default: 60 seconds)
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

/**
 * Invalidate all cache entries matching a prefix
 * @param prefix Key prefix to match (e.g., 'folders' invalidates 'folders', 'folders:123', etc.)
 */
export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  cache.clear();
}

// Cache keys
export const CACHE_KEYS = {
  FOLDERS: 'folders',
  TAGS: 'tags',
} as const;
