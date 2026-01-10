import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WatchlistItem } from '@prisma/client';
import { UniversalSearchResult } from '@/app/api/watchlist/search/universal/route';

export function useWatchlistMutations() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (item: UniversalSearchResult) => {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: String(item.externalId),
          type: item.type.toUpperCase(),
          title: item.title,
          imageUrl: item.image,
          year: item.year,
          rating: item.rating,
          episodes: item.episodes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Add error:', error);
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const markWatchedMutation = useMutation({
    mutationFn: async ({ id, item }: { id?: string; item?: UniversalSearchResult | WatchlistItem }) => {
      if (id) {
        // Update existing item
        const res = await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'WATCHED' }),
        });
        if (!res.ok) throw new Error('Failed to mark as watched');
        return res.json();
      } else if (item) {
        // Add new item as watched
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalId: String(item.externalId || (item as WatchlistItem).externalId),
            type: ((item as UniversalSearchResult).type || (item as WatchlistItem).type).toUpperCase(),
            title: (item as UniversalSearchResult).title || (item as WatchlistItem).title,
            imageUrl: (item as UniversalSearchResult).image || (item as WatchlistItem).imageUrl,
            year: (item as UniversalSearchResult).year || (item as WatchlistItem).year,
            rating: (item as UniversalSearchResult).rating || (item as WatchlistItem).rating,
            episodes: (item as UniversalSearchResult).episodes || (item as WatchlistItem).episodes,
            status: 'WATCHED',
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add to watched');
        }
        return res.json();
      }
      throw new Error('Invalid parameters');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Mark watched error:', error);
      alert(error.message);
    },
  });

  const markWatchingMutation = useMutation({
    mutationFn: async ({ id, item }: { id?: string; item?: UniversalSearchResult | WatchlistItem }) => {
      if (id) {
        // Update existing item
        const res = await fetch('/api/watchlist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'WATCHING' }),
        });
        if (!res.ok) throw new Error('Failed to mark as watching');
        return res.json();
      } else if (item) {
        // Add new item as watching
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalId: String(item.externalId || (item as WatchlistItem).externalId),
            type: ((item as UniversalSearchResult).type || (item as WatchlistItem).type).toUpperCase(),
            title: (item as UniversalSearchResult).title || (item as WatchlistItem).title,
            imageUrl: (item as UniversalSearchResult).image || (item as WatchlistItem).imageUrl,
            year: (item as UniversalSearchResult).year || (item as WatchlistItem).year,
            rating: (item as UniversalSearchResult).rating || (item as WatchlistItem).rating,
            episodes: (item as UniversalSearchResult).episodes || (item as WatchlistItem).episodes,
            status: 'WATCHING',
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add to watching');
        }
        return res.json();
      }
      throw new Error('Invalid parameters');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Mark watching error:', error);
      alert(error.message);
    },
  });

  return {
    addMutation,
    deleteMutation,
    markWatchedMutation,
    markWatchingMutation,
  };
}
