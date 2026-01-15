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
  const planToPlayGames: Game[] = allGames.filter(
    item => item.status !== 'PLAYED' && item.status !== 'PLAYING'
  );
  const playedGames: Game[] = allGames
    .filter(item => item.status === 'PLAYED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const playingGames: Game[] = allGames
    .filter(item => item.status === 'PLAYING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    allGames,
    planToPlayGames,
    playedGames,
    playingGames,
    isLoading,
    error,
  };
}
