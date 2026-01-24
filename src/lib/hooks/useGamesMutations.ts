import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Game } from '@prisma/client';
import { GameSearchResult, GameStatus } from '@/types/games';
import { getAuthHeaders } from '@/lib/api-client';

export function useGamesMutations() {
  const queryClient = useQueryClient();

  const addGameMutation = useMutation({
    mutationFn: async ({ game, status = 'PLAYLIST' }: { game: GameSearchResult; status?: GameStatus }) => {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          rawgGameId: game.id,
          gameTitle: game.name,
          coverArtUrl: game.coverImage,
          rawgRating: game.rating,
          releaseDate: game.releaseDate,
          genres: game.genres.join(', '),
          platforms: game.platforms.join(', '),
          metacritic: game.metacritic,
          status,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add game');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: Game[] }>(['games'], (old) => {
        if (!old) return { items: [data.item] };
        const exists = old.items.some((g) => g.rawgGameId === data.item.rawgGameId);
        if (exists) {
          // Update existing item
          return {
            items: old.items.map((g) =>
              g.rawgGameId === data.item.rawgGameId ? data.item : g
            ),
          };
        }
        return { items: [data.item, ...old.items] };
      });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: Error) => {
      console.error('Add game error:', error);
      alert(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GameStatus }) => {
      const res = await fetch('/api/games', {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update game');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: Game[] }>(['games'], (old) => {
        if (!old) return { items: [data.item] };
        return {
          items: old.items.map((g) => (g.id === data.item.id ? data.item : g)),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: Error) => {
      console.error('Update status error:', error);
      alert(error.message);
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/games?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete game');
      return { id };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ items: Game[] }>(['games'], (old) => {
        if (!old) return { items: [] };
        return { items: old.items.filter((g) => g.id !== data.id) };
      });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
    onError: (error: Error) => {
      console.error('Delete game error:', error);
      alert(error.message);
    },
  });

  return {
    addGameMutation,
    updateStatusMutation,
    deleteGameMutation,
  };
}
