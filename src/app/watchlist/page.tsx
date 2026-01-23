'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { Carousel } from '@/components/watchlist/Carousel';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { SearchResultCard } from '@/components/watchlist/SearchResultCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { UniversalSearchResult } from '@/app/api/watchlist/search/universal/route';
import { ListVideo } from 'lucide-react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { WatchlistItem } from '@prisma/client';

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const searchFilter = (searchParams.get('filter') as 'all' | 'anime' | 'movie' | 'show') || 'all';
  const searchPage = parseInt(searchParams.get('page') || '1', 10);

  const { watchlistItems, watchedItems, watchingItems, allItems, isLoading: listLoading } = useWatchlist();
  const { addMutation, deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();

  // Stable randomized order - only created once per page load
  const randomizedOrderRef = useRef<Map<string, number>>(new Map());
  const hasInitializedRef = useRef(false);

  // Separate refs for anime, movies, and shows randomization
  const animeOrderRef = useRef<Map<string, number>>(new Map());
  const moviesOrderRef = useRef<Map<string, number>>(new Map());
  const showsOrderRef = useRef<Map<string, number>>(new Map());
  const hasInitializedAnimeRef = useRef(false);
  const hasInitializedMoviesRef = useRef(false);
  const hasInitializedShowsRef = useRef(false);

  // Search query
  const { data: searchData, isLoading: searchLoading } = useQuery<{ results: UniversalSearchResult[] }>({
    queryKey: ['universal-search', searchQuery],
    queryFn: async () => {
      const { getAuthHeaders } = await import('@/lib/api-client');
      const res = await fetch(`/api/watchlist/search/universal?query=${encodeURIComponent(searchQuery)}`, {
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
    if (!hasInitializedRef.current && !listLoading && watchlistItems.length > 0) {
      const watchlistOrder = watchlistItems.map((_: WatchlistItem, index: number) => index);
      for (let i = watchlistOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [watchlistOrder[i], watchlistOrder[j]] = [watchlistOrder[j], watchlistOrder[i]];
      }
      watchlistItems.forEach((item: WatchlistItem, originalIndex: number) => {
        randomizedOrderRef.current.set(item.id, watchlistOrder[originalIndex]);
      });
      hasInitializedRef.current = true;
    }
  }, [watchlistItems, listLoading]);

  // Get randomized watchlist items - filter to only include current items, maintain stable order
  const randomizedWatchlist = useMemo(() => {
    if (!hasInitializedRef.current && watchlistItems.length > 0) {
      const watchlistOrder = watchlistItems.map((_: WatchlistItem, index: number) => index);
      for (let i = watchlistOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [watchlistOrder[i], watchlistOrder[j]] = [watchlistOrder[j], watchlistOrder[i]];
      }
      watchlistItems.forEach((item: WatchlistItem, originalIndex: number) => {
        randomizedOrderRef.current.set(item.id, watchlistOrder[originalIndex]);
      });
      hasInitializedRef.current = true;
    }

    if (!hasInitializedRef.current) return watchlistItems;

    const watchlistOrders = Array.from(randomizedOrderRef.current.values()).filter(v => v < 10000);
    const maxWatchlistOrder = watchlistOrders.length > 0 ? Math.max(...watchlistOrders) : -1;

    const itemsWithOrder = watchlistItems
      .map(item => {
        let order = randomizedOrderRef.current.get(item.id);
        if (order === undefined || order >= 10000) {
          order = Math.random() * 1000 + maxWatchlistOrder + 1000;
          randomizedOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);

    // Limit to 21 items for the main watchlist section
    return itemsWithOrder.map(({ item }) => item).slice(0, 21);
  }, [watchlistItems]);

  // Group watchlist by type (excluding watched)
  const allAnime = watchlistItems.filter(item => item.type === 'ANIME');
  const allMovies = watchlistItems.filter(item => item.type === 'MOVIE');
  const allShows = watchlistItems.filter(item => item.type === 'SHOW');

  // Get randomized anime list - limit to 21 items
  const animeList = useMemo(() => {
    if (!hasInitializedAnimeRef.current && !listLoading && allAnime.length > 0) {
      const animeOrder = allAnime.map((_: WatchlistItem, index: number) => index);
      for (let i = animeOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [animeOrder[i], animeOrder[j]] = [animeOrder[j], animeOrder[i]];
      }
      allAnime.forEach((item: WatchlistItem, originalIndex: number) => {
        animeOrderRef.current.set(item.id, animeOrder[originalIndex]);
      });
      hasInitializedAnimeRef.current = true;
    }

    if (!hasInitializedAnimeRef.current || allAnime.length === 0) return allAnime.slice(0, 21);

    const itemsWithOrder = allAnime
      .map(item => {
        let order = animeOrderRef.current.get(item.id);
        if (order === undefined) {
          const maxOrder = Math.max(...Array.from(animeOrderRef.current.values()).filter(v => v < 10000), -1);
          order = Math.random() * 1000 + maxOrder + 1000;
          animeOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);

    return itemsWithOrder.map(({ item }) => item).slice(0, 21);
  }, [allAnime, listLoading]);

  // Get randomized movies list - limit to 21 items
  const moviesList = useMemo(() => {
    if (!hasInitializedMoviesRef.current && !listLoading && allMovies.length > 0) {
      const moviesOrder = allMovies.map((_: WatchlistItem, index: number) => index);
      for (let i = moviesOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moviesOrder[i], moviesOrder[j]] = [moviesOrder[j], moviesOrder[i]];
      }
      allMovies.forEach((item: WatchlistItem, originalIndex: number) => {
        moviesOrderRef.current.set(item.id, moviesOrder[originalIndex]);
      });
      hasInitializedMoviesRef.current = true;
    }

    if (!hasInitializedMoviesRef.current || allMovies.length === 0) return allMovies.slice(0, 21);

    const itemsWithOrder = allMovies
      .map(item => {
        let order = moviesOrderRef.current.get(item.id);
        if (order === undefined) {
          const maxOrder = Math.max(...Array.from(moviesOrderRef.current.values()).filter(v => v < 10000), -1);
          order = Math.random() * 1000 + maxOrder + 1000;
          moviesOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);

    return itemsWithOrder.map(({ item }) => item).slice(0, 21);
  }, [allMovies, listLoading]);

  // Get randomized shows list - limit to 21 items
  const showsList = useMemo(() => {
    if (!hasInitializedShowsRef.current && !listLoading && allShows.length > 0) {
      const showsOrder = allShows.map((_: WatchlistItem, index: number) => index);
      for (let i = showsOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [showsOrder[i], showsOrder[j]] = [showsOrder[j], showsOrder[i]];
      }
      allShows.forEach((item: WatchlistItem, originalIndex: number) => {
        showsOrderRef.current.set(item.id, showsOrder[originalIndex]);
      });
      hasInitializedShowsRef.current = true;
    }

    if (!hasInitializedShowsRef.current || allShows.length === 0) return allShows.slice(0, 21);

    const itemsWithOrder = allShows
      .map(item => {
        let order = showsOrderRef.current.get(item.id);
        if (order === undefined) {
          const maxOrder = Math.max(...Array.from(showsOrderRef.current.values()).filter(v => v < 10000), -1);
          order = Math.random() * 1000 + maxOrder + 1000;
          showsOrderRef.current.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order);

    return itemsWithOrder.map(({ item }) => item).slice(0, 21);
  }, [allShows, listLoading]);

  // Filter out items without images or ratings from search results
  const searchResults: UniversalSearchResult[] = (searchData?.results || []).filter(
    (result: UniversalSearchResult) =>
      result.image &&
      result.image.trim() !== '' &&
      result.rating &&
      result.rating > 0
  );

  // Helper to check if item is in watchlist
  const isInWatchlist = (externalId: number, type: string) => {
    return watchlistItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to check if item is watched
  const isWatched = (externalId: number, type: string) => {
    return watchedItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to check if item is watching
  const isWatching = (externalId: number, type: string) => {
    return watchingItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to get watchlist item ID by externalId and type
  const getWatchlistItemId = (externalId: number, type: string): string | null => {
    const item = allItems.find(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
    return item?.id || null;
  };

  // Filter search results based on selected filter
  const filteredSearchResults = useMemo(() => {
    if (searchFilter === 'all') return searchResults;
    return searchResults.filter(item => item.type.toLowerCase() === searchFilter);
  }, [searchResults, searchFilter]);


  // Grid card width hook - viewport aware
  const { containerRef: searchContainerRef, itemsPerPage: searchItemsPerPage, isReady: searchGridReady } = useViewportGrid({
    headerHeight: 160, // Nav + filters + spacing
    footerHeight: 0, // No footer - pagination is in header
    minCardWidth: 120, // 20% larger than before (was 100)
    maxCardWidth: 204, // 20% larger than before (was 170)
    gap: 8, // Tighter gap between cards
    textHeightBelowCard: 45, // Compact text area
  });

  // Paginate filtered search results using viewport-aware items per page
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (searchPage - 1) * searchItemsPerPage;
    return filteredSearchResults.slice(startIndex, startIndex + searchItemsPerPage);
  }, [filteredSearchResults, searchPage, searchItemsPerPage]);

  const totalSearchPages = Math.ceil(filteredSearchResults.length / searchItemsPerPage);

  // Adjust page when itemsPerPage changes (e.g., on window resize)
  useEffect(() => {
    if (totalSearchPages > 0 && searchPage > totalSearchPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams();
      // Always preserve search query
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      // Preserve filter
      if (searchFilter && searchFilter !== 'all') {
        params.set('filter', searchFilter);
      }
      params.set('page', totalSearchPages.toString());
      router.replace(`/watchlist?${params.toString()}`);
    }
  }, [searchItemsPerPage, totalSearchPages, searchPage, searchQuery, searchFilter, router]);

  const handleFilterChange = (newFilter: 'all' | 'anime' | 'movie' | 'show') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', newFilter);
    params.set('page', '1');
    router.push(`/watchlist?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    // Always preserve search query
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    // Preserve filter
    if (searchFilter && searchFilter !== 'all') {
      params.set('filter', searchFilter);
    }
    // Set the new page
    params.set('page', newPage.toString());
    router.push(`/watchlist?${params.toString()}`);
  };

  const showingSearch = searchQuery.length > 0;

  return (
    <div className={`w-full py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 ${showingSearch ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'}`}>
      <div className={`w-full space-y-2 sm:space-y-3 md:space-y-4 ${showingSearch ? 'flex flex-col h-full' : ''}`}>
        <WatchlistNav />

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex flex-col flex-1 min-h-0 space-y-4">
              {/* Search Filters */}
              <div className="flex items-center justify-between min-h-[36px] flex-shrink-0">
                {searchResults.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      variant={searchFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('all')}
                      className="text-caption sm:text-body-sm"
                    >
                      All ({searchResults.length})
                    </Button>
                    <Button
                      variant={searchFilter === 'anime' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('anime')}
                      className="text-caption sm:text-body-sm"
                    >
                      Anime ({searchResults.filter(item => item.type.toLowerCase() === 'anime').length})
                    </Button>
                    <Button
                      variant={searchFilter === 'movie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('movie')}
                      className="text-caption sm:text-body-sm"
                    >
                      Movie ({searchResults.filter(item => item.type.toLowerCase() === 'movie').length})
                    </Button>
                    <Button
                      variant={searchFilter === 'show' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFilterChange('show')}
                      className="text-caption sm:text-body-sm"
                    >
                      TV Show ({searchResults.filter(item => item.type.toLowerCase() === 'show').length})
                    </Button>
                  </div>
                ) : (
                  <div></div>
                )}
                {/* Pagination Controls */}
                {totalSearchPages > 1 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, searchPage - 1))}
                      disabled={searchPage === 1}
                      className="text-caption sm:text-body-sm"
                    >
                      Previous
                    </Button>
                    <span className="text-caption sm:text-body-sm text-muted-foreground whitespace-nowrap">
                      Page {searchPage} of {totalSearchPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalSearchPages, searchPage + 1))}
                      disabled={searchPage === totalSearchPages}
                      className="text-caption sm:text-body-sm"
                    >
                      Next
                    </Button>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Search Results - Grid Layout - NO SCROLL */}
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <div ref={searchContainerRef} className="watchlist-grid w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                  {searchLoading || !searchGridReady ? (
                    Array.from({ length: searchItemsPerPage || 18 }).map((_, i) => (
                      <div key={`skeleton-${i}`} style={{ width: '100%', minWidth: 0 }}>
                        <CardSkeleton />
                      </div>
                    ))
                  ) : paginatedSearchResults.length > 0 ? (
                    paginatedSearchResults.map((result) => {
                      const alreadyInList = isInWatchlist(result.externalId, result.type);
                      const itemWatched = isWatched(result.externalId, result.type);
                      const itemWatching = isWatching(result.externalId, result.type);
                      const itemId = getWatchlistItemId(result.externalId, result.type);
                      return (
                        <div key={result.id} style={{ width: '100%', minWidth: 0 }}>
                          <SearchResultCard
                            result={result}
                            onAdd={() => addMutation.mutate(result)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                            isWatched={itemWatched}
                            isWatching={itemWatching}
                            onMarkWatched={() => markWatchedMutation.mutate({ item: result })}
                            isMarkingWatched={markWatchedMutation.isPending}
                            onMarkWatching={() => markWatchingMutation.mutate({ item: result })}
                            isMarkingWatching={markWatchingMutation.isPending}
                            onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
                          />
                        </div>
                      );
                    })
                  ) : null}
                </div>
              </div>

              {/* Empty States */}
              {!searchLoading && searchGridReady && paginatedSearchResults.length === 0 && (
                searchResults.length > 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center text-body text-muted-foreground">
                      <p>No {searchFilter === 'all' ? '' : searchFilter} results found for "{searchQuery}"</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-body text-muted-foreground">
                      <p>No results found for "{searchQuery}"</p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {listLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 4 }).map((_, i) => (
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
            ) : watchlistItems.length > 0 ? (
              <>
                {/* Main Watchlist Section */}
                {randomizedWatchlist.length > 0 && (
                  <Carousel title="Watchlist" icon={<ListVideo className="h-4 w-4" />}>
                    {randomizedWatchlist.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <WatchlistCard
                          item={item}
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Anime Section */}
                {animeList.length > 0 && (
                  <Carousel
                    title="Anime"
                    count={animeList.length}
                    totalCount={allAnime.length}
                    icon={<ListVideo className="h-4 w-4" />}
                    showMoreLink={allAnime.length > 21 ? '/watchlist/anime' : undefined}
                  >
                    {animeList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <WatchlistCard
                          item={item}
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Movies Section */}
                {moviesList.length > 0 && (
                  <Carousel
                    title="Movies"
                    count={moviesList.length}
                    totalCount={allMovies.length}
                    icon={<ListVideo className="h-4 w-4" />}
                    showMoreLink={allMovies.length > 21 ? '/watchlist/movie' : undefined}
                  >
                    {moviesList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <WatchlistCard
                          item={item}
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* TV Shows Section */}
                {showsList.length > 0 && (
                  <Carousel
                    title="TV Shows"
                    count={showsList.length}
                    totalCount={allShows.length}
                    icon={<ListVideo className="h-4 w-4" />}
                    showMoreLink={allShows.length > 21 ? '/watchlist/show' : undefined}
                  >
                    {showsList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <WatchlistCard
                          item={item}
                          onDelete={() => deleteMutation.mutate(item.id)}
                          onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                          onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                        />
                      </div>
                    ))}
                  </Carousel>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                  <p className="text-title">Your watchlist is empty</p>
                  <p className="text-body-sm">Search for anime, movies, or TV shows to add them to your watchlist</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchlistPage() {
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
      <WatchlistContent />
    </Suspense>
  );
}
