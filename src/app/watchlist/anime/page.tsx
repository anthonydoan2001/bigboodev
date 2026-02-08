'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useEffect, Suspense, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { GridCard } from '@/components/watchlist/GridCard';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { Loader2 } from 'lucide-react';

function AnimeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { watchlistItems, isLoading } = useWatchlist();
  const { deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();

  const { containerRef, itemsPerPage } = useViewportGrid({
    headerHeight: 140,
    gap: 8,
    textHeightBelowCard: 45,
  });

  // Filter watchlist items to only show anime
  const animeItems = useMemo(() => {
    return watchlistItems.filter(item => item.type === 'ANIME');
  }, [watchlistItems]);

  // Paginate anime items
  const paginatedAnimeItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return animeItems.slice(startIndex, startIndex + itemsPerPage);
  }, [animeItems, page, itemsPerPage]);

  const totalPages = Math.ceil(animeItems.length / itemsPerPage);

  // Adjust page when itemsPerPage changes
  const hasMounted = useRef(false);
  useEffect(() => { hasMounted.current = true; }, []);

  useEffect(() => {
    if (!hasMounted.current) return;
    if (totalPages > 0 && page > totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', totalPages.toString());
      router.replace(`/watchlist/anime?${params.toString()}`);
    }
  }, [totalPages, page, searchParams, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/watchlist/anime?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="w-full flex flex-col h-full space-y-4 sm:space-y-6">
          <WatchlistNav />
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-4 sm:space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <WatchlistNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
          {/* Pagination Controls */}
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

          {/* Anime Results - Grid Layout - NO SCROLL */}
          {paginatedAnimeItems.length > 0 ? (
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <div ref={containerRef} className="watchlist-grid w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                {paginatedAnimeItems.map((item) => (
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
                <p className="text-base sm:text-lg font-semibold">No anime in your watchlist</p>
                <p className="text-xs sm:text-sm">Search for anime to add them to your watchlist</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnimePage() {
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
      <AnimeContent />
    </Suspense>
  );
}
