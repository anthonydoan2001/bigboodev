'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useEffect, useState, Suspense } from 'react';
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

function ShowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { watchlistItems, isLoading } = useWatchlist();
  const { deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();

  const { containerRef, itemsPerPage, isReady } = useViewportGrid({
    headerHeight: 140, // Nav + spacing (no filters)
    footerHeight: 0, // No footer - pagination is in header
    minCardWidth: 120, // 20% larger than before (was 100)
    maxCardWidth: 204, // 20% larger than before (was 170)
    gap: 8, // Tighter gap between cards
    textHeightBelowCard: 45, // Compact text area
  });

  // Filter watchlist items to only show TV shows
  const showItems = useMemo(() => {
    return watchlistItems.filter(item => item.type === 'SHOW');
  }, [watchlistItems]);

  // Paginate show items
  const paginatedShowItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return showItems.slice(startIndex, startIndex + itemsPerPage);
  }, [showItems, page, itemsPerPage]);

  const totalPages = Math.ceil(showItems.length / itemsPerPage);

  // Track if this is the initial mount to prevent unnecessary redirects
  const [hasMounted, setHasMounted] = useState(false);
  const [isStable, setIsStable] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Wait for grid to stabilize before showing content
  useEffect(() => {
    if (isReady && !isLoading) {
      const timer = setTimeout(() => {
        setIsStable(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsStable(false);
    }
  }, [isReady, isLoading]);

  // Adjust page when itemsPerPage changes (e.g., on window resize)
  useEffect(() => {
    if (!hasMounted || !isReady) return;

    if (totalPages > 0 && page > totalPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', totalPages.toString());
      router.replace(`/watchlist/show?${params.toString()}`);
    }
  }, [itemsPerPage, totalPages, page, searchParams, router, hasMounted, isReady]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/watchlist/show?${params.toString()}`);
  };

  // Show loading overlay until grid is ready, stable, and data is loaded
  const showLoading = isLoading || !isReady || !isStable;

  return (
    <div className="w-full h-screen flex flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden relative">
      {/* Loading Overlay */}
      {showLoading && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="w-full flex flex-col h-full space-y-4 sm:space-y-6">
            <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
              <WatchlistNav />
            </Suspense>
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col h-full space-y-4 sm:space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <WatchlistNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
          {/* Pagination Controls - Always show structure to prevent layout shift */}
          <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0">
            <div></div>
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

          {/* TV Show Results - Grid Layout - NO SCROLL */}
          {paginatedShowItems.length > 0 ? (
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <div ref={containerRef} className="watchlist-grid w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                {paginatedShowItems.map((item) => (
                  <div key={item.id} style={{ width: '100%', minWidth: 0 }}>
                    <GridCard
                      item={item}
                      onDelete={() => deleteMutation.mutate(item.id)}
                      onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                      onMarkWatching={() => markWatchingMutation.mutate({ id: item.id })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center text-muted-foreground space-y-3 sm:space-y-4">
                <p className="text-base sm:text-lg font-semibold">No TV shows in your watchlist</p>
                <p className="text-xs sm:text-sm">Search for TV shows to add them to your watchlist</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShowPage() {
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
      <ShowContent />
    </Suspense>
  );
}
