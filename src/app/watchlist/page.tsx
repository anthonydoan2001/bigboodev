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
import { useGridCardWidth } from '@/lib/hooks/useGridCardWidth';
import { WatchlistItem } from '@prisma/client';

const ITEMS_PER_PAGE = 22;

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

  // Search query
  const { data: searchData, isLoading: searchLoading } = useQuery<{ results: UniversalSearchResult[] }>({
    queryKey: ['universal-search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/search/universal?query=${encodeURIComponent(searchQuery)}`);
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
    
    return itemsWithOrder.map(({ item }) => item);
  }, [watchlistItems]);

  // Group watchlist by type (excluding watched)
  const animeList = watchlistItems.filter(item => item.type === 'ANIME');
  const moviesList = watchlistItems.filter(item => item.type === 'MOVIE');
  const showsList = watchlistItems.filter(item => item.type === 'SHOW');

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

  // Paginate filtered search results
  const paginatedSearchResults = useMemo(() => {
    const startIndex = (searchPage - 1) * ITEMS_PER_PAGE;
    return filteredSearchResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSearchResults, searchPage]);

  const totalSearchPages = Math.ceil(filteredSearchResults.length / ITEMS_PER_PAGE);

  // Grid card width hook - recalculate when search results change
  const { containerRef: searchContainerRef } = useGridCardWidth({
    recalculateTrigger: `${paginatedSearchResults.length}-${searchPage}-${searchData?.results?.length || 0}`
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (searchQuery && searchPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchPage, searchQuery]);

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
    <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
      <div className="w-full space-y-6">
        <WatchlistNav />

        {/* Content */}
        {showingSearch ? (
          <div className="space-y-8">
            {searchLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <div ref={searchContainerRef} className="grid gap-x-4 gap-y-6">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                      <CardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Filters */}
                <div className="flex items-center justify-between h-[36px]">
                  {searchResults.length > 0 ? (
                    <div className="flex gap-2 items-center">
                      <Button
                        variant={searchFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('all')}
                      >
                        All ({searchResults.length})
                      </Button>
                      <Button
                        variant={searchFilter === 'anime' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('anime')}
                      >
                        Anime ({searchResults.filter(item => item.type.toLowerCase() === 'anime').length})
                      </Button>
                      <Button
                        variant={searchFilter === 'movie' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('movie')}
                      >
                        Movie ({searchResults.filter(item => item.type.toLowerCase() === 'movie').length})
                      </Button>
                      <Button
                        variant={searchFilter === 'show' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('show')}
                      >
                        TV Show ({searchResults.filter(item => item.type.toLowerCase() === 'show').length})
                      </Button>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <div></div>
                </div>

                {/* Search Results - Grid Layout */}
                {paginatedSearchResults.length > 0 ? (
                  <>
                    {/* Min height for 2 rows: ~340px per row (280px image + 60px text) */}
                    <div className="min-h-[700px]">
                      <div ref={searchContainerRef} className="grid gap-x-4 gap-y-6">
                        {paginatedSearchResults.map((result) => {
                          const alreadyInList = isInWatchlist(result.externalId, result.type);
                          const itemWatched = isWatched(result.externalId, result.type);
                          const itemWatching = isWatching(result.externalId, result.type);
                          const itemId = getWatchlistItemId(result.externalId, result.type);
                          return (
                            <div key={result.id} style={{ width: 'var(--item-width, 200px)' }}>
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
                        })}
                      </div>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalSearchPages > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(1, searchPage - 1))}
                          disabled={searchPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {searchPage} of {totalSearchPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.min(totalSearchPages, searchPage + 1))}
                          disabled={searchPage === totalSearchPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : searchResults.length > 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <p>No {searchFilter === 'all' ? '' : searchFilter} results found for "{searchQuery}"</p>
                    </CardContent>
                  </Card>
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
                  <Carousel title="Watchlist" count={randomizedWatchlist.length} icon={<ListVideo className="h-4 w-4" />}>
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
                  <Carousel title="Anime" count={animeList.length} icon={<ListVideo className="h-4 w-4" />}>
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
                  <Carousel title="Movies" count={moviesList.length} icon={<ListVideo className="h-4 w-4" />}>
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
                  <Carousel title="TV Shows" count={showsList.length} icon={<ListVideo className="h-4 w-4" />}>
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
                  <p className="text-lg">Your watchlist is empty</p>
                  <p className="text-sm">Search for anime, movies, or TV shows to add them to your watchlist</p>
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
      <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-center">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid gap-x-4 gap-y-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <WatchlistContent />
    </Suspense>
  );
}
