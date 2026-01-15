import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Game } from '@prisma/client';
import { GameSearchResult } from '@/types/games';
import { getAuthHeaders } from '@/lib/api-client';

export function useGamesMutations() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (item: GameSearchResult) => {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          externalId: String(item.externalId),
          title: item.title,
          imageUrl: item.image,
          rating: item.rating,
          released: item.year ? `${item.year}-01-01` : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Optimistically update the cache immediately
      queryClient.setQueryData<{ items: Game[] }>(['games'], (old) => {
        if (!old) return { items: [data.item] };
        // Check if item already exists
        const exists = old.items.some(
          (i) => i.externalId === data.item.externalId
        );
        if (exists) return old;
        // Add new item to the beginning
        return { items: [data.item, ...old.items] };
      });
      // Refetch in background to ensure consistency (non-blocking)
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: Error) => {
      console.error('Add error:', error);
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/games?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });

  const markPlayingMutation = useMutation({
    mutationFn: async ({ id, item }: { id?: string; item?: GameSearchResult | Game }) => {
      if (id) {
        // Update existing item
        const res = await fetch('/api/games', {
          method: 'PATCH',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ id, status: 'PLAYING' }),
        });
        if (!res.ok) throw new Error('Failed to mark as playing');
        return res.json();
      } else if (item) {
        // Add new item as playing
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({
            externalId: String((item as GameSearchResult).externalId || (item as Game).externalId),
            title: (item as GameSearchResult).title || (item as Game).title,
            imageUrl: (item as GameSearchResult).image || (item as Game).imageUrl,
            rating: (item as GameSearchResult).rating || (item as Game).rating,
            released: (item as GameSearchResult).year ? `${(item as GameSearchResult).year}-01-01` : (item as Game).released,
            status: 'PLAYING',
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add to playing');
        }
        return res.json();
      }
      throw new Error('Invalid parameters');
    },
    onSuccess: (data) => {
      // Optimistically update the cache immediately
      queryClient.setQueryData<{ items: Game[] }>(['games'], (old) => {
        if (!old) return { items: [data.item] };
        // Update existing item or add new one
        const existingIndex = old.items.findIndex((i) => i.id === data.item.id);
        if (existingIndex >= 0) {
          // Update existing item
          const updated = [...old.items];
          updated[existingIndex] = data.item;
          return { items: updated };
        }
        // Add new item to the beginning
        return { items: [data.item, ...old.items] };
      });
      // Refetch in background to ensure consistency (non-blocking)
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: Error) => {
      console.error('Mark playing error:', error);
      alert(error.message);
    },
  });

  const markPlayedMutation = useMutation({
    mutationFn: async ({ id, item }: { id?: string; item?: GameSearchResult | Game }) => {
      if (id) {
        // Update existing item
        const res = await fetch('/api/games', {
          method: 'PATCH',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ id, status: 'PLAYED' }),
        });
        if (!res.ok) throw new Error('Failed to mark as played');
        return res.json();
      } else if (item) {
        // Add new item as played
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({
            externalId: String((item as GameSearchResult).externalId || (item as Game).externalId),
            title: (item as GameSearchResult).title || (item as Game).title,
            imageUrl: (item as GameSearchResult).image || (item as Game).imageUrl,
            rating: (item as GameSearchResult).rating || (item as Game).rating,
            released: (item as GameSearchResult).year ? `${(item as GameSearchResult).year}-01-01` : (item as Game).released,
            status: 'PLAYED',
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to add to played');
        }
        return res.json();
      }
      throw new Error('Invalid parameters');
    },
    onSuccess: (data) => {
      // Optimistically update the cache immediately
      queryClient.setQueryData<{ items: Game[] }>(['games'], (old) => {
        if (!old) return { items: [data.item] };
        // Update existing item or add new one
        const existingIndex = old.items.findIndex((i) => i.id === data.item.id);
        if (existingIndex >= 0) {
          // Update existing item
          const updated = [...old.items];
          updated[existingIndex] = data.item;
          return { items: updated };
        }
        // Add new item to the beginning
        return { items: [data.item, ...old.items] };
      });
      // Refetch in background to ensure consistency (non-blocking)
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: Error) => {
      console.error('Mark played error:', error);
      alert(error.message);
    },
  });

  return {
    addMutation,
    deleteMutation,
    markPlayingMutation,
    markPlayedMutation,
  };
}
