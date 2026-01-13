'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function WatchedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get('filter') as 'all' | 'anime' | 'movie' | 'show') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { watchedItems, isLoading } = useWatchlist();
  const { deleteMutation } = useWatchlistMutations();
  
  const { containerRef, itemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + filters + spacing
    footerHeight: 0, // No footer - pagination is in header
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

  return (
    <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <WatchlistNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Watched Filters */}
          <div className="flex items-center justify-between h-[36px] flex-shrink-0">
            {watchedItems.length > 0 ? (
              <div className="flex gap-2 items-center">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                >
                  All ({watchedItems.length})
                </Button>
                <Button
                  variant={filter === 'anime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('anime')}
                >
                  Anime ({watchedItems.filter(item => item.type === 'ANIME').length})
                </Button>
                <Button
                  variant={filter === 'movie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('movie')}
                >
                  Movie ({watchedItems.filter(item => item.type === 'MOVIE').length})
                </Button>
                <Button
                  variant={filter === 'show' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('show')}
                >
                  TV Show ({watchedItems.filter(item => item.type === 'SHOW').length})
                </Button>
              </div>
            ) : (
              <div></div>
            )}
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

          {/* Watched Results - Grid Layout */}
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
          ) : paginatedWatchedItems.length > 0 ? (
            <div className="flex-1 overflow-hidden min-h-0">
              <div ref={containerRef} className="grid gap-4 h-full" style={{ gridAutoRows: 'min-content' }}>
                {paginatedWatchedItems.map((item) => (
                  <div key={item.id} style={{ width: 'var(--item-width, 200px)' }}>
                    <WatchlistCard
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
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No {filter === 'all' ? '' : filter} watched items found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <p className="text-lg">No watched items yet</p>
                <p className="text-sm">Mark items from your watchlist or search results as watched</p>
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
      <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
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
      <WatchedContent />
    </Suspense>
  );
}
