'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { TopGame, GameSearchResult } from '@/types/games';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { Carousel } from '@/components/watchlist/Carousel';
import { TopGameCard } from '@/components/games/TopGameCard';
import { GamesNav } from '@/components/games/GamesNav';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { useQuery } from '@tanstack/react-query';
import { ListVideo, RefreshCw } from 'lucide-react';
import { Suspense, useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function TopContent() {
  const { planToPlayGames, playedGames, playingGames, allGames, isLoading: gamesLoading } = useGames();
  const { addMutation, deleteMutation, markPlayingMutation, markPlayedMutation } = useGamesMutations();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  const { data: topData, isLoading: topLoading, refetch } = useQuery<{ results: TopGame[] }>({
    queryKey: ['top-games'],
    queryFn: async () => {
      const { getAuthHeaders } = await import('@/lib/api-client');
      const res = await fetch('/api/games/top', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch top games');
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Auto-trigger refresh if no data and haven't tried yet
  useEffect(() => {
    if (!topLoading && topData && (!topData.results || topData.results.length === 0) && !hasTriedRefresh) {
      handleRefresh();
    }
  }, [topLoading, topData, hasTriedRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setHasTriedRefresh(true);
    try {
      const { getAuthHeaders } = await import('@/lib/api-client');
      await fetch('/api/games/top/refresh?force=true', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      // Refetch top games after refresh
      setTimeout(() => {
        refetch();
        setIsRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to refresh top games:', error);
      setIsRefreshing(false);
    }
  };

  // Helper to check if item is in games list
  const isInGamesList = (externalId: number) => {
    return planToPlayGames.some(
      item => item.externalId === String(externalId)
    );
  };

  // Helper to check if item is played
  const isPlayed = (externalId: number) => {
    return playedGames.some(
      item => item.externalId === String(externalId)
    );
  };

  // Helper to check if item is playing
  const isPlaying = (externalId: number) => {
    return playingGames.some(
      item => item.externalId === String(externalId)
    );
  };

  // Filter out items without images or ratings, and exclude items in games list/played/playing
  // Use useMemo to recalculate when games data loads
  const topGames: TopGame[] = useMemo(() => {
    if (!topData?.results) return [];
    
    return topData.results.filter(
      (item: TopGame) => {
        // Basic filters
        if (!item.image || item.image.trim() === '' || !item.rating || item.rating <= 0) {
          return false;
        }
        
        // Only filter out games list/played/playing items if games data has loaded
        if (!gamesLoading) {
          if (isInGamesList(item.externalId) || 
              isPlayed(item.externalId) || 
              isPlaying(item.externalId)) {
            return false;
          }
        }
        
        return true;
      }
    );
  }, [topData, gamesLoading, planToPlayGames, playedGames, playingGames]);

  // Helper to get game item ID by externalId
  const getGameItemId = (externalId: number): string | null => {
    const item = allGames.find(
      item => item.externalId === String(externalId)
    );
    return item?.id || null;
  };

  // Limit to 20 top games
  const topGamesList = topGames.slice(0, 20);

  return (
    <div className="w-full py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen">
      <div className="w-full space-y-4 sm:space-y-6">
        <GamesNav />

        {topLoading || gamesLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <CardSkeleton key={j} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : topGames.length > 0 && topGamesList.length > 0 ? (
          <div className="space-y-8">
            <Carousel title="Top Games" count={topGamesList.length} icon={<ListVideo className="h-4 w-4" />} showCount={false}>
              {topGamesList.map((item) => {
                const alreadyInList = isInGamesList(item.externalId);
                const itemPlayed = isPlayed(item.externalId);
                const itemPlaying = isPlaying(item.externalId);
                const itemId = getGameItemId(item.externalId);
                return (
                  <div key={item.id} className="flex-shrink-0 snap-start overflow-visible" style={{ width: 'var(--item-width, 200px)', minWidth: 0 }}>
                    <TopGameCard
                      item={item}
                      onAdd={() => addMutation.mutate({
                        id: item.id,
                        type: 'game' as const,
                        title: item.title,
                        image: item.image ?? '',
                        year: item.year ?? null,
                        rating: item.rating ?? null,
                        externalId: item.externalId,
                      } as GameSearchResult)}
                      isAdding={addMutation.isPending}
                      alreadyInList={alreadyInList}
                      isPlayed={itemPlayed}
                      isPlaying={itemPlaying}
                      onMarkPlayed={() => markPlayedMutation.mutate({
                        item: {
                          id: item.id,
                          type: 'game' as const,
                          title: item.title,
                          image: item.image ?? '',
                          year: item.year ?? null,
                          rating: item.rating ?? null,
                          externalId: item.externalId,
                        } as GameSearchResult
                      })}
                      isMarkingPlayed={markPlayedMutation.isPending}
                      onMarkPlaying={() => markPlayingMutation.mutate({
                        item: {
                          id: item.id,
                          type: 'game' as const,
                          title: item.title,
                          image: item.image ?? '',
                          year: item.year ?? null,
                          rating: item.rating ?? null,
                          externalId: item.externalId,
                        } as GameSearchResult
                      })}
                      isMarkingPlaying={markPlayingMutation.isPending}
                      onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                    />
                  </div>
                );
              })}
            </Carousel>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground space-y-4">
              <p>No top games available</p>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Top Games'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function TopPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-4 sm:space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
          <div className="space-y-8">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <CardSkeleton key={j} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <TopContent />
    </Suspense>
  );
}
