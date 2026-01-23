'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { GridCard } from '@/components/watchlist/GridCard';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function WatchedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get('filter') as 'all' | 'anime' | 'movie' | 'show') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { watchedItems, isLoading } = useWatchlist();
  const { deleteMutation } = useWatchlistMutations();

  const { containerRef, itemsPerPage, isReady } = useViewportGrid({
    headerHeight: 160, // Nav + filters + spacing
    footerHeight: 0, // No footer - pagination is in header
    minCardWidth: 120, // 20% larger than before (was 100)
    maxCardWidth: 204, // 20% larger than before (was 170)
    gap: 8, // Tighter gap between cards
    textHeightBelowCard: 45, // Compact text area
  });

  // Filter watched items based on selected filter
  const filteredWatchedItems = useMemo(() => {
    if (filter === 'all') return watchedItems;
    const filterType = filter.toUpperCase();
    return watchedItems.filter(item => item.type === filterType);
  }, [watchedItems, filter]);

  // Paginate filtered watched items
  const paginatedWatchedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredWatchedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWatchedItems, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredWatchedItems.length / itemsPerPage);

  // Track if this is the initial mount to prevent unnecessary redirects
  const [hasMounted, setHasMounted] = useState(false);
  const [isStable, setIsStable] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Wait for grid to stabilize before showing content
  useEffect(() => {
    if (isReady && !isLoading) {
      // Small delay to ensure grid has fully calculated and stabilized
      const timer = setTimeout(() => {
        setIsStable(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsStable(false);
    }
  }, [isReady, isLoading]);

  // Adjust page when itemsPerPage changes (e.g., on window resize)
  // Only redirect if we've mounted AND grid is ready to prevent initial flash
  useEffect(() => {
    if (!hasMounted || !isReady) return;

    if (totalPages > 0 && page > totalPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', totalPages.toString());
      router.replace(`/watchlist/watched?${params.toString()}`);
    }
  }, [itemsPerPage, totalPages, page, searchParams, router, hasMounted, isReady]);

  const handleFilterChange = (newFilter: 'all' | 'anime' | 'movie' | 'show') => {
    const params = new URLSearchParams();
    params.set('filter', newFilter);
    params.set('page', '1');
    router.push(`/watchlist/watched?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/watchlist/watched?${params.toString()}`);
  };

  // Show loading overlay until grid is ready, stable, and data is loaded
  const showLoading = isLoading || !isReady || !isStable;

  return (
    <div className="w-full h-screen flex flex-col py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 overflow-hidden relative">
      {/* Loading Overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6">
          <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
            <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
              <WatchlistNav />
            </Suspense>
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <WatchlistNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
          {/* Watched Filters */}
          <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0 flex-wrap gap-2">
            {watchedItems.length > 0 ? (
              <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  All ({watchedItems.length})
                </Button>
                <Button
                  variant={filter === 'anime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('anime')}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  Anime ({watchedItems.filter(item => item.type === 'ANIME').length})
                </Button>
                <Button
                  variant={filter === 'movie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('movie')}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  Movie ({watchedItems.filter(item => item.type === 'MOVIE').length})
                </Button>
                <Button
                  variant={filter === 'show' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('show')}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  TV Show ({watchedItems.filter(item => item.type === 'SHOW').length})
                </Button>
              </div>
            ) : (
              <div></div>
            )}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-1">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Watched Results - Grid Layout - NO SCROLL */}
          {paginatedWatchedItems.length > 0 ? (
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <div
                ref={containerRef}
                className="watchlist-grid w-full h-full overflow-hidden"
                style={{
                  gridAutoRows: 'min-content'
                }}
              >
                {paginatedWatchedItems.map((item) => (
                  <div key={item.id} style={{ width: '100%', minWidth: 0 }}>
                    <GridCard
                      item={item}
                      onDelete={() => deleteMutation.mutate(item.id)}
                      disableContextMenu={true}
                      hideStatusBadge={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : watchedItems.length > 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
                <p className="text-sm sm:text-base">No {filter === 'all' ? '' : filter} watched items found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center text-muted-foreground space-y-3 sm:space-y-4">
                <p className="text-base sm:text-lg font-semibold">No watched items yet</p>
                <p className="text-xs sm:text-sm">Mark items from your watchlist or search results as watched</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchedPage() {
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
      <WatchedContent />
    </Suspense>
  );
}
