import { Game } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getAuthHeaders } from '@/lib/api-client';

export function useGames() {
  const { data, isLoading, error } = useQuery<{ items: Game[] }>({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch games');
      return res.json();
    },
    staleTime: 60000,
  });

  const allGames: Game[] = useMemo(() => data?.items || [], [data?.items]);

  // Memoize filtered and sorted arrays to avoid recalculation on every render
  const { playingGames, playedGames, playlistGames } = useMemo(() => {
    const playing: Game[] = [];
    const played: Game[] = [];
    const playlist: Game[] = [];

    // Single pass through all games
    for (const game of allGames) {
      if (game.status === 'PLAYING') playing.push(game);
      else if (game.status === 'PLAYED') played.push(game);
      else if (game.status === 'PLAYLIST') playlist.push(game);
    }

    // Sort each category
    playing.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    played.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    playlist.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { playingGames: playing, playedGames: played, playlistGames: playlist };
  }, [allGames]);

  return {
    allGames,
    playingGames,
    playedGames,
    playlistGames,
    isLoading,
    error,
  };
}
