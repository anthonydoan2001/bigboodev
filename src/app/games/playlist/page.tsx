'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { GamesNav } from '@/components/games/GamesNav';
import { GameCard } from '@/components/games/GameCard';
import { GameSearchCard } from '@/components/games/GameSearchCard';
import { GameCardSkeleton } from '@/components/games/GameCardSkeleton';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { getAuthHeaders } from '@/lib/api-client';
import { GameSearchResult } from '@/types/games';
import { Loader2 } from 'lucide-react';

function PlaylistContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const { playlistGames, allGames, isLoading } = useGames();
  const { addGameMutation, updateStatusMutation, deleteGameMutation } = useGamesMutations();

  // Search query
  const { data: searchData, isLoading: searchLoading } = useQuery<{
    results: GameSearchResult[];
    count: number;
  }>({
    queryKey: ['games-search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/games/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to search games');
      return res.json();
    },
    enabled: searchQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const searchResults = searchData?.results || [];

  // Helper to check if game is in list
  const getGameStatus = (rawgGameId: number) => {
    const game = allGames.find(g => g.rawgGameId === rawgGameId);
    return game ? { inList: true, status: game.status as 'PLAYING' | 'PLAYED' | 'PLAYLIST', id: game.id } : { inList: false, status: null, id: null };
  };

  const showingSearch = searchQuery.length > 0;

  return (
    <div className="w-full py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 min-h-screen">
      <div className="w-full space-y-4 sm:space-y-6">
        <GamesNav />

        {showingSearch ? (
          // Search Results
          searchLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {searchResults.map((result) => {
                const gameStatus = getGameStatus(result.id);
                return (
                  <GameSearchCard
                    key={result.id}
                    result={result}
                    onAdd={(status) => addGameMutation.mutate({ game: result, status })}
                    isAdding={addGameMutation.isPending}
                    alreadyInList={gameStatus.inList}
                    currentStatus={gameStatus.status}
                    onUpdateStatus={gameStatus.id ? (status) => updateStatusMutation.mutate({ id: gameStatus.id!, status }) : undefined}
                    onDelete={gameStatus.id ? () => deleteGameMutation.mutate(gameStatus.id!) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No results found for "{searchQuery}"</p>
              </CardContent>
            </Card>
          )
        ) : (
          // Playlist
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : playlistGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {playlistGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onDelete={() => deleteGameMutation.mutate(game.id)}
                  onMarkPlaying={() => updateStatusMutation.mutate({ id: game.id, status: 'PLAYING' })}
                  onMarkPlayed={() => updateStatusMutation.mutate({ id: game.id, status: 'PLAYED' })}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <p className="text-title">Your playlist is empty</p>
                <p className="text-body-sm">Search for games to add them to your playlist</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

export default function PlaylistPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="w-full flex flex-col h-full space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    }>
      <PlaylistContent />
    </Suspense>
  );
}
