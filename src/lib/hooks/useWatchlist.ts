import { WatchlistItem } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAuthHeaders } from '@/lib/api-client';

export function useWatchlist() {
  const { data, isLoading, error } = useQuery<{ items: WatchlistItem[] }>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      return res.json();
    },
    staleTime: 60000,
  });

  const allItems: WatchlistItem[] = data?.items || [];

  // Memoize categorized items - single pass through all items
  const { watchlistItems, watchedItems, watchingItems } = useMemo(() => {
    const watchlist: WatchlistItem[] = [];
    const watched: WatchlistItem[] = [];
    const watching: WatchlistItem[] = [];

    for (const item of allItems) {
      if (item.status === 'WATCHED') watched.push(item);
      else if (item.status === 'WATCHING') watching.push(item);
      else watchlist.push(item);
    }

    // Sort by createdAt descending
    watched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    watching.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { watchlistItems: watchlist, watchedItems: watched, watchingItems: watching };
  }, [allItems]);

  return {
    allItems,
    watchlistItems,
    watchedItems,
    watchingItems,
    isLoading,
    error,
  };
}
