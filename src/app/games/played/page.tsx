'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GamesNav } from '@/components/games/GamesNav';
import { GameCard } from '@/components/games/GameCard';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function PlayedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { playedGames, isLoading } = useGames();
  const { deleteMutation } = useGamesMutations();
  
  const { containerRef, itemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
  });

  // Paginate played games
  const paginatedPlayedGames = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return playedGames.slice(startIndex, startIndex + itemsPerPage);
  }, [playedGames, page, itemsPerPage]);

  const totalPages = Math.ceil(playedGames.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    router.push(`/games/played?${params.toString()}`);
  };

  return (
    <div className="w-full h-screen flex flex-col py-8 px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <GamesNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="flex items-center justify-end h-[36px] flex-shrink-0">
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
            </div>
          ) : (
            <div></div>
          )}

          {/* Played Results - Grid Layout */}
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
          ) : paginatedPlayedGames.length > 0 ? (
            <div className="flex-1 overflow-hidden min-h-0">
              <div ref={containerRef} className="grid gap-4 h-full" style={{ gridAutoRows: 'min-content' }}>
                {paginatedPlayedGames.map((item) => (
                  <div key={item.id} style={{ width: 'var(--item-width, 200px)' }}>
                    <GameCard 
                      item={item} 
                      onDelete={() => deleteMutation.mutate(item.id)}
                      hideStatusBadge={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : playedGames.length > 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No played games found on this page</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <p className="text-lg">No games played yet</p>
                <p className="text-sm">Mark games as played to see them here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayedPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
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
      <PlayedContent />
    </Suspense>
  );
}
