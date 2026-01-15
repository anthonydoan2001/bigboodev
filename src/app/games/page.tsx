'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GamesNav } from '@/components/games/GamesNav';
import { Carousel } from '@/components/watchlist/Carousel';
import { GameCard } from '@/components/games/GameCard';
import { SearchResultCard } from '@/components/games/SearchResultCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { GameSearchResult } from '@/types/games';
import { ListVideo } from 'lucide-react';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { Game } from '@prisma/client';

function GamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const searchPage = parseInt(searchParams.get('page') || '1', 10);

  const { planToPlayGames, playedGames, playingGames, allGames, isLoading: listLoading } = useGames();
  const { addMutation, deleteMutation, markPlayingMutation, markPlayedMutation } = useGamesMutations();

  // Stable randomized order - only created once per page load
  const randomizedOrderRef = useRef<Map<string, number>>(new Map());
  const hasInitializedRef = useRef(false);

  // Search query
  const { data: searchData, isLoading: searchLoading } = useQuery<{ results: GameSearchResult[] }>({
    queryKey: ['game-search', searchQuery],
    queryFn: async () => {
      const { getAuthHeaders } = await import('@/lib/api-client');
      const res = await fetch(`/api/games/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to search');
      return res.json();
    },
    enabled: searchQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Create stable randomized order only on initial load
  useEffect(() => {
    if (!hasInitializedRef.current && !listLoading && planToPlayGames.length > 0) {
      const gamesOrder = planToPlayGames.map((_: Game, index: number) => index);
      for (let i = gamesOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gamesOrder[i], gamesOrder[j]] = [gamesOrder[j], gamesOrder[i]];
      }
      planToPlayGames.forEach((item: Game, originalIndex: number) => {
        randomizedOrderRef.current.set(item.id, gamesOrder[originalIndex]);
      });
      hasInitializedRef.current = true;
    }
  }, [planToPlayGames, listLoading]);

  // Get randomized plan to play games - filter to only include current items, maintain stable order
  const randomizedGames = useMemo(() => {
    if (!hasInitializedRef.current && planToPlayGames.length > 0) {
      const gamesOrder = planToPlayGames.map((_: Game, index: number) => index);
      for (let i = gamesOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gamesOrder[i], gamesOrder[j]] = [gamesOrder[j], gamesOrder[i]];
      }
      planToPlayGames.forEach((item: Game, originalIndex: number) => {
        randomizedOrderRef.current.set(item.id, gamesOrder[originalIndex]);
      });
      hasInitializedRef.current = true;
    }
    
    if (!hasInitializedRef.current) return planToPlayGames;
    
    const gamesOrders = Array.from(randomizedOrderRef.current.values()).filter(v => v < 10000);
    const maxGamesOrder = gamesOrders.length > 0 ? Math.max(...gamesOrders) : -1;
    
    const itemsWithOrder = planToPlayGames
      .map(item => {
        let order = randomizedOrderRef.current.get(item.id);
        if (order === undefined || order >= 10000) {
          order = Math.random() * 1000 + maxGamesOrder + 1000;
          randomizedOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);
    
    // Limit to 21 items for the main games section
    return itemsWithOrder.map(({ item }) => item).slice(0, 21);
  }, [planToPlayGames]);

  // Filter out items without images or ratings from search results
  const searchResults: GameSearchResult[] = (searchData?.results || []).filter(
    (result: GameSearchResult) => 
      result.image && 
      result.image.trim() !== '' && 
      result.rating && 
      result.rating > 0
  );

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

  // Helper to get game item ID by externalId
  const getGameItemId = (externalId: number): string | null => {
    const item = allGames.find(
      item => item.externalId === String(externalId)
    );
    return item?.id || null;
  };

  // Grid card width hook - viewport aware
  const { containerRef: searchContainerRef, itemsPerPage: searchItemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
  });

  // Paginate search results using viewport-aware items per page
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (searchPage - 1) * searchItemsPerPage;
    return searchResults.slice(startIndex, startIndex + searchItemsPerPage);
  }, [searchResults, searchPage, searchItemsPerPage]);

  const totalSearchPages = Math.ceil(searchResults.length / searchItemsPerPage);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    // Always preserve search query
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    // Set the new page
    params.set('page', newPage.toString());
    router.push(`/games?${params.toString()}`);
  };

  const showingSearch = searchQuery.length > 0;

  return (
    <div className={`w-full py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8 ${showingSearch ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'}`}>
      <div className={`w-full space-y-4 sm:space-y-6 ${showingSearch ? 'flex flex-col h-full' : ''}`}>
        <GamesNav />

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {searchLoading ? (
              <div className="flex-1 overflow-hidden min-h-0">
                <div ref={searchContainerRef} className="grid gap-4 h-full" style={{ gridAutoRows: 'min-content' }}>
                  {Array.from({ length: searchItemsPerPage || 18 }).map((_, i) => (
                    <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                      <CardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 space-y-4">
                {/* Pagination Controls */}
                {totalSearchPages > 1 ? (
                  <div className="flex items-center justify-end gap-2 flex-wrap min-h-[36px] flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, searchPage - 1))}
                      disabled={searchPage === 1}
                      className="text-xs sm:text-sm"
                    >
                      Previous
                    </Button>
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      Page {searchPage} of {totalSearchPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalSearchPages, searchPage + 1))}
                      disabled={searchPage === totalSearchPages}
                      className="text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                ) : (
                  <div></div>
                )}

                {/* Search Results - Grid Layout */}
                {paginatedSearchResults.length > 0 ? (
                  <div className="flex-1 overflow-hidden min-h-0">
                    <div ref={searchContainerRef} className="grid gap-4 h-full" style={{ gridAutoRows: 'min-content' }}>
                      {paginatedSearchResults.map((result) => {
                        const alreadyInList = isInGamesList(result.externalId);
                        const itemPlayed = isPlayed(result.externalId);
                        const itemPlaying = isPlaying(result.externalId);
                        const itemId = getGameItemId(result.externalId);
                        return (
                          <div key={result.id} style={{ width: 'var(--item-width, 200px)' }}>
                            <SearchResultCard
                              result={result}
                              onAdd={() => addMutation.mutate(result)}
                              isAdding={addMutation.isPending}
                              alreadyInList={alreadyInList}
                              isPlayed={itemPlayed}
                              isPlaying={itemPlaying}
                              onMarkPlayed={() => markPlayedMutation.mutate({ item: result })}
                              isMarkingPlayed={markPlayedMutation.isPending}
                              onMarkPlaying={() => markPlayingMutation.mutate({ item: result })}
                              isMarkingPlaying={markPlayingMutation.isPending}
                              onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <p>No results found for "{searchQuery}"</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {listLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 2 }).map((_, i) => (
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
            ) : planToPlayGames.length > 0 ? (
              <>
                {/* Main Games Section */}
                {randomizedGames.length > 0 && (
                  <Carousel title="Plan to Play" icon={<ListVideo className="h-4 w-4" />}>
                    {randomizedGames.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <GameCard
                          item={item}
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkPlayed={() => markPlayedMutation.mutate({ id: item.id })}
                          onMarkPlaying={() => markPlayingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                  <p className="text-lg">Your games list is empty</p>
                  <p className="text-sm">Search for games to add them to your list</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="w-full flex flex-col h-full space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded flex-shrink-0" />
            <div className="h-full flex-1 overflow-hidden">
              <div className="grid gap-4 h-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <GamesContent />
    </Suspense>
  );
}
