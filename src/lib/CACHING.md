# Caching Strategy

All client-side data fetching uses **React Query** with a tiered caching system.
Server-side fetches (API routes calling external APIs) use `cache: 'no-store'` uniformly.

## Tiers

Defined in `src/lib/cache-config.ts`. Spread into every `useQuery` call.

| Tier | staleTime | refetchInterval | Use when |
|------|-----------|-----------------|----------|
| `CACHE_REALTIME` | 0 | 30s | Live data that must stay current (live sports scores) |
| `CACHE_FAST` | 30s | 60s | Price-focused widgets, active reading progress |
| `CACHE_MODERATE` | 5 min | 5 min | Email, game stats, library browsing, notes, bookmarks |
| `CACHE_SLOW` | 15 min | 15 min | Weather, gas prices — slow-changing external data |
| `CACHE_STATIC` | 30 min | none | Settings, authors, series, shelves, folders — structural data |
| `CACHE_DASHBOARD` | 5 min | 5 min | Dashboard summary cards (PricesWidget) |

### Usage

```ts
import { CACHE_MODERATE } from '@/lib/cache-config';

const { data } = useQuery({
  queryKey: ['notes', filters],
  queryFn: () => fetchNotes(filters),
  ...CACHE_MODERATE,
});
```

Override individual properties after the spread when needed:

```ts
const { data } = useQuery({
  queryKey: ['manga', 'dashboard'],
  queryFn: fetchDashboard,
  ...CACHE_MODERATE,
  refetchOnWindowFocus: true, // override for active reading state
});
```

## Global Defaults (QueryProvider)

Set in `src/lib/providers/QueryProvider.tsx`:

- `refetchOnWindowFocus: false` — personal dashboard, no collaboration pressure
- `staleTime: 60_000` — fallback; prefer explicit tiers

Hooks that need window-focus refetching (e.g. manga in-progress/on-deck) override with
`refetchOnWindowFocus: true` explicitly.

## Query Key Conventions

- Dashboard summary queries: `['dashboard', '<domain>']` (e.g. `['dashboard', 'stocks']`)
- Detail/dedicated widget queries: `['<domain>']` (e.g. `['stockQuotes']`, `['cryptoQuotes']`)
- Nested resources: `['<domain>', '<resource>', ...params]` (e.g. `['manga', 'books', seriesId]`)

Dashboard summary and detail widgets use **separate query keys** so they can have different
freshness tiers without cache conflicts.

## Server-Side Fetch Strategy

All `fetch()` calls in API route handlers and `src/lib/api/*.ts` use `cache: 'no-store'`.

Rationale:
- External API responses are cached client-side by React Query
- Adding Next.js fetch cache creates a second caching layer with unclear invalidation
- `no-store` keeps server-side behavior simple and predictable

## Adding a New Query

1. Pick the tier that matches your data's volatility
2. Import from `@/lib/cache-config`
3. Spread the tier into your `useQuery` options
4. Do NOT add `refetchOnWindowFocus: false` — it's already the global default
5. Use a unique query key that won't collide with other widgets
