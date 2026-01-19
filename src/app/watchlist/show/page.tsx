'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function ShowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { watchlistItems, isLoading } = useWatchlist();
  const { deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();
  
  const { containerRef, itemsPerPage } = useViewportGrid({
    headerHeight: 140, // Nav + spacing (no filters)
    footerHeight: 0, // No footer - pagination is in header
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

  // Adjust page when itemsPerPage changes (e.g., on window resize)
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', totalPages.toString());
      router.replace(`/watchlist/show?${params.toString()}`);
    }
  }, [itemsPerPage, totalPages, page, searchParams, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/watchlist/show?${params.toString()}`);
  };

  return (
    <div className="w-full h-screen flex flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
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
          {isLoading ? (
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <div ref={containerRef} className="watchlist-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                {Array.from({ length: itemsPerPage || 18 }).map((_, i) => (
                  <div key={i} style={{ width: '100%', minWidth: 0 }}>
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ) : paginatedShowItems.length > 0 ? (
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <div ref={containerRef} className="watchlist-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                {paginatedShowItems.map((item) => (
                  <div key={item.id} style={{ width: '100%', minWidth: 0 }}>
                    <WatchlistCard
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
      <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            <div className="grid gap-x-4 gap-y-6">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                  <CardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ShowContent />
    </Suspense>
  );
}
