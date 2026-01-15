'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GamesNav } from '@/components/games/GamesNav';
import { GameCard } from '@/components/games/GameCard';
import { SearchResultCard } from '@/components/games/SearchResultCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { GameSearchResult } from '@/types/games';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';

function GamesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const searchPage = parseInt(searchParams.get('page') || '1', 10);
  const listPage = parseInt(searchParams.get('listPage') || '1', 10);

  const { planToPlayGames, playedGames, playingGames, allGames, isLoading: listLoading } = useGames();
  const { addMutation, deleteMutation, markPlayingMutation, markPlayedMutation } = useGamesMutations();

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

  // Grid card width hooks - viewport aware with responsive sizing
  const { containerRef: searchContainerRef, itemsPerPage: searchItemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
    maxCardWidth: 650, // Larger cards (will be clamped responsively)
    minCardWidth: 280, // Larger minimum (will be clamped responsively)
    cardAspectRatio: 9/16, // 16/9 aspect ratio (height/width)
  });

  const { containerRef: listContainerRef, itemsPerPage: listItemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
    maxCardWidth: 650, // Larger cards (will be clamped responsively)
    minCardWidth: 280, // Larger minimum (will be clamped responsively)
    cardAspectRatio: 9/16, // 16/9 aspect ratio (height/width)
  });

  // Paginate search results using viewport-aware items per page
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (searchPage - 1) * searchItemsPerPage;
    return searchResults.slice(startIndex, startIndex + searchItemsPerPage);
  }, [searchResults, searchPage, searchItemsPerPage]);

  const totalSearchPages = Math.ceil(searchResults.length / searchItemsPerPage);

  // Paginate plan to play games
  const paginatedPlanToPlayGames = useMemo(() => {
    const startIndex = (listPage - 1) * listItemsPerPage;
    return planToPlayGames.slice(startIndex, startIndex + listItemsPerPage);
  }, [planToPlayGames, listPage, listItemsPerPage]);

  const totalListPages = Math.ceil(planToPlayGames.length / listItemsPerPage);

  const handleSearchPageChange = (newPage: number) => {
    const params = new URLSearchParams();
    // Always preserve search query
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    // Set the new page
    params.set('page', newPage.toString());
    router.push(`/games?${params.toString()}`);
  };

  const handleListPageChange = (newPage: number) => {
    const params = new URLSearchParams();
    // Preserve search query if exists
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    // Set the list page
    params.set('listPage', newPage.toString());
    router.push(`/games?${params.toString()}`);
  };

  const showingSearch = searchQuery.length > 0;

  return (
    <div className={`w-full ${showingSearch ? 'h-screen flex flex-col overflow-hidden py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8' : 'h-screen flex flex-col overflow-hidden py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8'}`}>
      <div className={`w-full ${showingSearch ? 'space-y-3 sm:space-y-4 md:space-y-6 flex flex-col h-full' : 'flex flex-col h-full space-y-4 sm:space-y-6'}`}>
        <GamesNav />

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {searchLoading ? (
              <div className="flex-1 overflow-hidden min-h-0">
                <div ref={searchContainerRef} className="grid gap-3 sm:gap-4 h-full w-full" style={{ gridAutoRows: 'min-content' }}>
                  {Array.from({ length: searchItemsPerPage || 18 }).map((_, i) => (
                    <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                      <CardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 space-y-4">
                {/* Pagination Controls - Same row as header */}
                <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0">
                  <div></div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearchPageChange(Math.max(1, searchPage - 1))}
                      disabled={searchPage === 1}
                      className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      Previous
                    </Button>
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-1">
                      Page {searchPage} of {totalSearchPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearchPageChange(Math.min(totalSearchPages, searchPage + 1))}
                      disabled={searchPage === totalSearchPages}
                      className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Search Results - Grid Layout */}
                {paginatedSearchResults.length > 0 ? (
                  <div className="flex-1 overflow-hidden min-h-0 w-full">
                    <div ref={searchContainerRef} className="grid gap-3 sm:gap-4 h-full w-full" style={{ gridAutoRows: 'min-content' }}>
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
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Pagination Controls - Always show, same row as header */}
            <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0">
              <div></div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleListPageChange(Math.max(1, listPage - 1))}
                  disabled={listPage === 1}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-1">
                  Page {listPage} of {totalListPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleListPageChange(Math.min(totalListPages, listPage + 1))}
                  disabled={listPage === totalListPages}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Plan to Play Games - Grid Layout */}
            {listLoading ? (
              <div className="flex-1 overflow-hidden min-h-0 w-full">
                <div ref={listContainerRef} className="grid gap-3 sm:gap-4 h-full w-full" style={{ gridAutoRows: 'min-content' }}>
                  {Array.from({ length: listItemsPerPage || 18 }).map((_, i) => (
                    <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                      <CardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ) : paginatedPlanToPlayGames.length > 0 ? (
              <div className="flex-1 overflow-hidden min-h-0 w-full">
                <div ref={listContainerRef} className="grid gap-3 sm:gap-4 h-full w-full" style={{ gridAutoRows: 'min-content' }}>
                  {paginatedPlanToPlayGames.map((item) => (
                    <div key={item.id} style={{ width: 'var(--item-width, 200px)' }}>
                      <GameCard
                        item={item}
                        onDelete={() => deleteMutation.mutate(item.id)}
                        onMarkPlayed={() => markPlayedMutation.mutate({ id: item.id })}
                        onMarkPlaying={() => markPlayingMutation.mutate({ id: item.id })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : planToPlayGames.length > 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No games found on this page</p>
                </CardContent>
              </Card>
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
