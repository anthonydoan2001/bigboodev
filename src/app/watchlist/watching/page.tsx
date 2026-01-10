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
import { useGridCardWidth } from '@/lib/hooks/useGridCardWidth';

export const dynamic = 'force-dynamic';

function WatchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get('filter') as 'all' | 'anime' | 'movie' | 'show') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { watchingItems, isLoading } = useWatchlist();
  const { deleteMutation, markWatchedMutation } = useWatchlistMutations();
  
  const { containerRef, columns } = useGridCardWidth();

  // Filter watching items based on selected filter
  const filteredWatchingItems = useMemo(() => {
    if (filter === 'all') return watchingItems;
    const filterType = filter.toUpperCase();
    return watchingItems.filter(item => item.type === filterType);
  }, [watchingItems, filter]);

  // Calculate items per page to show exactly 2 rows
  const itemsPerPage = useMemo(() => {
    return columns * 2;
  }, [columns]);

  // Paginate filtered watching items
  const paginatedWatchingItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredWatchingItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWatchingItems, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredWatchingItems.length / itemsPerPage);

  const handleFilterChange = (newFilter: 'all' | 'anime' | 'movie' | 'show') => {
    const params = new URLSearchParams();
    params.set('filter', newFilter);
    params.set('page', '1');
    router.push(`/watchlist/watching?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (filter !== 'all') {
      params.set('filter', filter);
    }
    params.set('page', newPage.toString());
    router.push(`/watchlist/watching?${params.toString()}`);
  };

  return (
    <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
      <div className="w-full space-y-6">
        <WatchlistNav />

        <div className="space-y-8">
          {/* Watching Filters */}
          <div className="flex items-center justify-between h-[36px]">
            {watchingItems.length > 0 ? (
              <div className="flex gap-2 items-center">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                >
                  All ({watchingItems.length})
                </Button>
                <Button
                  variant={filter === 'anime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('anime')}
                >
                  Anime ({watchingItems.filter(item => item.type === 'ANIME').length})
                </Button>
                <Button
                  variant={filter === 'movie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('movie')}
                >
                  Movie ({watchingItems.filter(item => item.type === 'MOVIE').length})
                </Button>
                <Button
                  variant={filter === 'show' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('show')}
                >
                  TV Show ({watchingItems.filter(item => item.type === 'SHOW').length})
                </Button>
              </div>
            ) : (
              <div></div>
            )}
            <div></div>
          </div>

          {/* Watching Results - Grid Layout */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <div ref={containerRef} className="grid gap-x-4 gap-y-6">
                {Array.from({ length: columns * 2 || 12 }).map((_, i) => (
                  <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ) : paginatedWatchingItems.length > 0 ? (
            <>
              <div className="space-y-4">
                <div ref={containerRef} className="grid gap-x-4 gap-y-6">
                  {paginatedWatchingItems.map((item) => (
                    <div key={item.id} style={{ width: 'var(--item-width, 200px)' }}>
                      <WatchlistCard 
                        item={item} 
                        onDelete={() => deleteMutation.mutate(item.id)}
                        onMarkWatched={() => markWatchedMutation.mutate({ id: item.id })}
                        hideStatusBadge={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
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
              )}
            </>
          ) : watchingItems.length > 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No {filter === 'all' ? '' : filter} watching items found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <p className="text-lg">No items currently watching</p>
                <p className="text-sm">Mark items from your watchlist as watching to see them here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchingPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-6">
          <WatchlistNav />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid gap-x-4 gap-y-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                  <CardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <WatchingContent />
    </Suspense>
  );
}
