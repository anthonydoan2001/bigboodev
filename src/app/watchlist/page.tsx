'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { Carousel } from '@/components/watchlist/Carousel';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { SearchResultCard } from '@/components/watchlist/SearchResultCard';
import { UniversalSearchResult } from '@/app/api/watchlist/search/universal/route';
import { ListVideo, Loader2 } from 'lucide-react';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { getAuthHeaders } from '@/lib/api-client';

// Stable randomization class - maintains order across renders
class StableRandomOrder {
  private orderMap = new Map<string, number>();
  private isInitialized = false;

  getOrdered<T extends { id: string }>(items: T[], limit: number = 21): T[] {
    // Initialize order map on first call with items
    if (!this.isInitialized && items.length > 0) {
      const indices = items.map((_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      items.forEach((item, i) => this.orderMap.set(item.id, indices[i]));
      this.isInitialized = true;
    }

    if (!this.isInitialized) return items.slice(0, limit);

    // Get max existing order for new items
    const existingOrders = Array.from(this.orderMap.values()).filter(v => v < 10000);
    const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : -1;

    // Sort by stored order, assign new order to new items
    return items
      .map(item => {
        let order = this.orderMap.get(item.id);
        if (order === undefined) {
          order = Math.random() * 1000 + maxOrder + 1000;
          this.orderMap.set(item.id, order);
        }
        return { item, order };
      })
      .sort((a, b) => a.order - b.order)
      .slice(0, limit)
      .map(({ item }) => item);
  }
}

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const searchFilter = (searchParams.get('filter') as 'all' | 'anime' | 'movie' | 'show') || 'all';
  const searchPage = parseInt(searchParams.get('page') || '1', 10);

  const { watchlistItems, watchedItems, watchingItems, allItems, isLoading: listLoading } = useWatchlist();
  const { addMutation, deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();

  // Stable randomized order instances - created once per page load
  const watchlistOrderRef = useRef(new StableRandomOrder());
  const animeOrderRef = useRef(new StableRandomOrder());
  const moviesOrderRef = useRef(new StableRandomOrder());
  const showsOrderRef = useRef(new StableRandomOrder());

  // Search query - static import instead of dynamic
  const { data: searchData, isLoading: searchLoading } = useQuery<{ results: UniversalSearchResult[] }>({
    queryKey: ['universal-search', searchQuery],
    queryFn: async () => {
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

  // Memoized grouped items by type
  const { allAnime, allMovies, allShows } = useMemo(() => ({
    allAnime: watchlistItems.filter(item => item.type === 'ANIME'),
    allMovies: watchlistItems.filter(item => item.type === 'MOVIE'),
    allShows: watchlistItems.filter(item => item.type === 'SHOW'),
  }), [watchlistItems]);

  // Randomized lists using stable order instances
  // Note: Accessing ref.current here is safe because StableRandomOrder instances are stable
  /* eslint-disable react-hooks/refs */
  const randomizedWatchlist = useMemo(() =>
    watchlistOrderRef.current.getOrdered(watchlistItems),
    [watchlistItems]
  );

  const animeList = useMemo(() =>
    animeOrderRef.current.getOrdered(allAnime),
    [allAnime]
  );

  const moviesList = useMemo(() =>
    moviesOrderRef.current.getOrdered(allMovies),
    [allMovies]
  );

  const showsList = useMemo(() =>
    showsOrderRef.current.getOrdered(allShows),
    [allShows]
  );
  /* eslint-enable react-hooks/refs */

  // Filter search results - memoized
  const searchResults = useMemo(() =>
    (searchData?.results || []).filter(
      (result: UniversalSearchResult) =>
        result.image?.trim() && result.rating && result.rating > 0
    ),
    [searchData?.results]
  );

  // Create lookup maps for O(1) status checks - memoized
  const itemLookup = useMemo(() => {
    const watchlistSet = new Set(watchlistItems.map(i => `${i.externalId}-${i.type}`));
    const watchedSet = new Set(watchedItems.map(i => `${i.externalId}-${i.type}`));
    const watchingSet = new Set(watchingItems.map(i => `${i.externalId}-${i.type}`));
    const idMap = new Map(allItems.map(i => [`${i.externalId}-${i.type}`, i.id]));

    return { watchlistSet, watchedSet, watchingSet, idMap };
  }, [watchlistItems, watchedItems, watchingItems, allItems]);

  // Memoized helper functions using lookup maps
  const isInWatchlist = useCallback((externalId: number, type: string) =>
    itemLookup.watchlistSet.has(`${externalId}-${type.toUpperCase()}`),
    [itemLookup.watchlistSet]
  );

  const isWatched = useCallback((externalId: number, type: string) =>
    itemLookup.watchedSet.has(`${externalId}-${type.toUpperCase()}`),
    [itemLookup.watchedSet]
  );

  const isWatching = useCallback((externalId: number, type: string) =>
    itemLookup.watchingSet.has(`${externalId}-${type.toUpperCase()}`),
    [itemLookup.watchingSet]
  );

  const getWatchlistItemId = useCallback((externalId: number, type: string): string | null =>
    itemLookup.idMap.get(`${externalId}-${type.toUpperCase()}`) || null,
    [itemLookup.idMap]
  );

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

  // Track if this is the initial mount to prevent unnecessary redirects
  const [hasMounted, setHasMounted] = useState(false);
  const [isSearchStable, setIsSearchStable] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Wait for search grid to stabilize before showing content
  useEffect(() => {
    if (searchGridReady && !searchLoading && searchQuery.length > 0) {
      // Small delay to ensure grid has fully calculated and stabilized
      const timer = setTimeout(() => {
        setIsSearchStable(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsSearchStable(false);
    }
  }, [searchGridReady, searchLoading, searchQuery]);

  // Adjust page when itemsPerPage changes (e.g., on window resize)
  // Only redirect if we've mounted AND grid is ready to prevent initial flash
  useEffect(() => {
    if (!hasMounted || !searchGridReady) return;

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
  }, [searchItemsPerPage, totalSearchPages, searchPage, searchQuery, searchFilter, router, hasMounted, searchGridReady]);

  const handleFilterChange = useCallback((newFilter: 'all' | 'anime' | 'movie' | 'show') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('filter', newFilter);
    params.set('page', '1');
    router.push(`/watchlist?${params.toString()}`);
  }, [searchParams, router]);

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (searchFilter && searchFilter !== 'all') params.set('filter', searchFilter);
    params.set('page', newPage.toString());
    router.push(`/watchlist?${params.toString()}`);
  }, [searchQuery, searchFilter, router]);

  const showingSearch = searchQuery.length > 0;

  // Show loading overlay for search until grid is ready and stable
  const showSearchLoading = showingSearch && (searchLoading || !searchGridReady || !isSearchStable);

  return (
    <div className={`w-full py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 ${showingSearch ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen'}`}>
      <div className={`w-full space-y-2 sm:space-y-3 md:space-y-4 ${showingSearch ? 'flex flex-col h-full' : ''}`}>
        <WatchlistNav />

        {/* Content */}
        {showingSearch ? (
          <div className="flex flex-col flex-1 min-h-0 space-y-4 relative">
            {/* Loading Overlay for Search */}
            {showSearchLoading && (
              <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

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
                  {paginatedSearchResults.length > 0 ? (
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
              {paginatedSearchResults.length === 0 && (
                searchResults.length > 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center text-body text-muted-foreground">
                      <p>No {searchFilter === 'all' ? '' : searchFilter} results found for &ldquo;{searchQuery}&rdquo;</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-body text-muted-foreground">
                      <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {listLoading ? (
              <div className="w-full min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : watchlistItems.length > 0 ? (
              <>
                {/* Main Watchlist Section */}
                {randomizedWatchlist.length > 0 && (
                  <Carousel title="Watchlist" icon={<ListVideo className="h-4 w-4" />}>
                    {randomizedWatchlist.map((item) => (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 160px)' }}>
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
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 160px)' }}>
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
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 160px)' }}>
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
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 160px)' }}>
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
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    }>
      <WatchlistContent />
    </Suspense>
  );
}
