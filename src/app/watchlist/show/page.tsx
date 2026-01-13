'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, Suspense } from 'react';
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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/watchlist/show?${params.toString()}`);
  };

  return (
    <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <WatchlistNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Empty space to match filter layout */}
          <div className="flex items-center justify-between h-[36px] flex-shrink-0">
            <div></div>
            {/* Pagination Controls */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            ) : (
              <div></div>
            )}
          </div>

          {/* TV Show Results - Grid Layout */}
          {isLoading ? (
            <div className="flex-1 overflow-hidden min-h-0">
              <div ref={containerRef} className="grid gap-4 h-full" style={{ gridAutoRows: 'min-content' }}>
                {Array.from({ length: itemsPerPage || 18 }).map((_, i) => (
                  <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ) : paginatedShowItems.length > 0 ? (
            <div className="flex-1 overflow-hidden min-h-0">
              <div ref={containerRef} className="grid gap-4 h-full" style={{ gridAutoRows: 'min-content' }}>
                {paginatedShowItems.map((item) => (
                  <div key={item.id} style={{ width: 'var(--item-width, 200px)' }}>
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
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <p className="text-lg">No TV shows in your watchlist</p>
                <p className="text-sm">Search for TV shows to add them to your watchlist</p>
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
