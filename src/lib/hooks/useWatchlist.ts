import { useQuery } from '@tanstack/react-query';
import { WatchlistItem } from '@prisma/client';

export function useWatchlist() {
  const { data, isLoading, error } = useQuery<{ items: WatchlistItem[] }>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      return res.json();
    },
    staleTime: 60000,
  });

  const allItems: WatchlistItem[] = data?.items || [];
  const watchlistItems: WatchlistItem[] = allItems.filter(
    item => item.status !== 'WATCHED' && item.status !== 'WATCHING'
  );
  const watchedItems: WatchlistItem[] = allItems
    .filter(item => item.status === 'WATCHED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const watchingItems: WatchlistItem[] = allItems
    .filter(item => item.status === 'WATCHING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    allItems,
    watchlistItems,
    watchedItems,
    watchingItems,
    isLoading,
    error,
  };
}
