'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useEffect, Suspense, useState } from 'react';
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
import { Loader2 } from 'lucide-react';

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
  const { containerRef: searchContainerRef, itemsPerPage: searchItemsPerPage, isReady: searchGridReady } = useViewportGrid({
    headerHeight: 160, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
    maxCardWidth: 650, // Larger cards (will be clamped responsively)
    minCardWidth: 280, // Larger minimum (will be clamped responsively)
    cardAspectRatio: 9/16, // 16/9 aspect ratio (height/width)
  });

  const { containerRef: listContainerRef, itemsPerPage: listItemsPerPage, isReady: listGridReady } = useViewportGrid({
    headerHeight: 160, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
    maxCardWidth: 650, // Larger cards (will be clamped responsively)
    minCardWidth: 280, // Larger minimum (will be clamped responsively)
    cardAspectRatio: 9/16, // 16/9 aspect ratio (height/width)
  });

  // Track if this is the initial mount to prevent unnecessary redirects
  const [hasMounted, setHasMounted] = useState(false);
  const [isStable, setIsStable] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  const showingSearch = searchQuery.length > 0;

  // Wait for grid to stabilize before showing content
  useEffect(() => {
    const gridReady = showingSearch ? searchGridReady : listGridReady;
    const isLoading = showingSearch ? searchLoading : listLoading;
    
    if (gridReady && !isLoading) {
      // Small delay to ensure grid has fully calculated and stabilized
      const timer = setTimeout(() => {
        setIsStable(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsStable(false);
    }
  }, [searchGridReady, listGridReady, searchLoading, listLoading, showingSearch]);

  // Adjust search page when itemsPerPage changes (e.g., on window resize)
  // Only redirect if we've mounted AND grid is ready to prevent initial flash
  useEffect(() => {
    if (!hasMounted || !searchGridReady) return;
    
    if (showingSearch && totalSearchPages > 0 && searchPage > totalSearchPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      params.set('page', totalSearchPages.toString());
      router.replace(`/games?${params.toString()}`);
    }
  }, [searchItemsPerPage, totalSearchPages, searchPage, searchQuery, showingSearch, router, hasMounted, searchGridReady]);

  // Adjust list page when itemsPerPage changes (e.g., on window resize)
  // Only redirect if we've mounted AND grid is ready to prevent initial flash
  useEffect(() => {
    if (!hasMounted || !listGridReady) return;
    
    if (!showingSearch && totalListPages > 0 && listPage > totalListPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      params.set('listPage', totalListPages.toString());
      router.replace(`/games?${params.toString()}`);
    }
  }, [listItemsPerPage, totalListPages, listPage, searchQuery, showingSearch, router, hasMounted, listGridReady]);

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

  // Show loading overlay until grid is ready, stable, and data is loaded
  const gridReady = showingSearch ? searchGridReady : listGridReady;
  const isLoading = showingSearch ? searchLoading : listLoading;
  const showLoading = isLoading || !gridReady || !isStable;

  return (
    <div className="w-full h-screen flex flex-col py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 overflow-hidden relative">
      {/* Loading Overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6">
          <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
            <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
              <GamesNav />
            </Suspense>
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <GamesNav />
        </Suspense>

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
            {/* Pagination Controls */}
            <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0 flex-wrap gap-2">
              <div></div>
              {totalSearchPages > 1 && (
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
              )}
            </div>

            {/* Search Results - Grid Layout */}
            {paginatedSearchResults.length > 0 ? (
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <div ref={searchContainerRef} className="games-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                  {paginatedSearchResults.map((result) => {
                    const alreadyInList = isInGamesList(result.externalId);
                    const itemPlayed = isPlayed(result.externalId);
                    const itemPlaying = isPlaying(result.externalId);
                    const itemId = getGameItemId(result.externalId);
                    return (
                      <div key={result.id} style={{ width: '100%', minWidth: 0 }}>
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
                <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">No results found for &quot;{searchQuery}&quot;</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
            {/* Pagination Controls */}
            <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0 flex-wrap gap-2">
              <div></div>
              {totalListPages > 1 && (
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
              )}
            </div>

            {/* Plan to Play Games - Grid Layout */}
            {paginatedPlanToPlayGames.length > 0 ? (
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <div ref={listContainerRef} className="games-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                  {paginatedPlanToPlayGames.map((item) => (
                    <div key={item.id} style={{ width: '100%', minWidth: 0 }}>
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
                <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">No games found on this page</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center text-muted-foreground space-y-3 sm:space-y-4">
                  <p className="text-base sm:text-lg font-semibold">Your games list is empty</p>
                  <p className="text-xs sm:text-sm">Search for games to add them to your list</p>
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
      <div className="w-full h-screen flex flex-col py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 overflow-hidden">
        <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    }>
      <GamesContent />
    </Suspense>
  );
}