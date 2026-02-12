/**
 * Centralized caching tiers for React Query.
 *
 * Each tier defines staleTime and refetchInterval based on how quickly
 * the underlying data changes. All queries should use one of these tiers
 * rather than hardcoding values.
 *
 * Global defaults (set in QueryProvider):
 *   - refetchOnWindowFocus: false
 *   - staleTime: 60_000 (fallback only — prefer explicit tiers)
 *
 * See src/lib/CACHING.md for full strategy documentation.
 */

// ── Tier definitions (ms) ──────────────────────────────────────────

/** Live data that must stay current (live sports scores). */
export const CACHE_REALTIME = {
  staleTime: 0,
  refetchInterval: 30_000,
} as const;

/** Price-focused widgets where ~1 min freshness matters. */
export const CACHE_FAST = {
  staleTime: 30_000,
  refetchInterval: 60_000,
} as const;

/** Data that changes occasionally — good enough at 5 min (gmail, game stats, reading progress). */
export const CACHE_MODERATE = {
  staleTime: 5 * 60_000,
  refetchInterval: 5 * 60_000,
} as const;

/** Slow-changing external data (weather, gas prices). */
export const CACHE_SLOW = {
  staleTime: 15 * 60_000,
  refetchInterval: 15 * 60_000,
} as const;

/** Structural / rarely-changing data (library metadata, folders, settings). No auto-refresh. */
export const CACHE_STATIC = {
  staleTime: 30 * 60_000,
} as const;

/** Dashboard summary cards — glanceable, not real-time. */
export const CACHE_DASHBOARD = {
  staleTime: 5 * 60_000,
  refetchInterval: 5 * 60_000,
} as const;
