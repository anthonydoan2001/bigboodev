import { Game } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
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

  const allGames: Game[] = data?.items || [];

  const playingGames: Game[] = allGames
    .filter(game => game.status === 'PLAYING')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const playedGames: Game[] = allGames
    .filter(game => game.status === 'PLAYED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const playlistGames: Game[] = allGames
    .filter(game => game.status === 'PLAYLIST')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    allGames,
    playingGames,
    playedGames,
    playlistGames,
    isLoading,
    error,
  };
}
