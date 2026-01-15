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

function PlayingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { playingGames, isLoading } = useGames();
  const { deleteMutation, markPlayedMutation } = useGamesMutations();
  
  const { containerRef, itemsPerPage } = useViewportGrid({
    headerHeight: 180, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
    maxCardWidth: 650, // Larger cards (will be clamped responsively)
    minCardWidth: 280, // Larger minimum (will be clamped responsively)
    cardAspectRatio: 9/16, // 16/9 aspect ratio (height/width)
  });

  // Paginate playing games
  const paginatedPlayingGames = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return playingGames.slice(startIndex, startIndex + itemsPerPage);
  }, [playingGames, page, itemsPerPage]);

  const totalPages = Math.ceil(playingGames.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    router.push(`/games/playing?${params.toString()}`);
  };

  return (
    <div className="w-full h-screen flex flex-col py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="w-full flex flex-col h-full space-y-4 sm:space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <GamesNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
          {/* Pagination Controls - Always show, same row as header */}
          <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0">
            <div></div>
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
          </div>

          {/* Playing Results - Grid Layout */}
          {isLoading ? (
            <div className="flex-1 overflow-hidden min-h-0 w-full">
              <div ref={containerRef} className="grid gap-3 sm:gap-4 h-full w-full" style={{ gridAutoRows: 'min-content' }}>
                {Array.from({ length: itemsPerPage || 18 }).map((_, i) => (
                  <div key={i} style={{ width: 'var(--item-width, 200px)' }}>
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          ) : paginatedPlayingGames.length > 0 ? (
            <div className="flex-1 overflow-hidden min-h-0 w-full">
              <div ref={containerRef} className="grid gap-3 sm:gap-4 h-full w-full" style={{ gridAutoRows: 'min-content' }}>
                {paginatedPlayingGames.map((item) => (
                  <div key={item.id} style={{ width: 'var(--item-width, 200px)' }}>
                    <GameCard 
                      item={item} 
                      onDelete={() => deleteMutation.mutate(item.id)}
                      onMarkPlayed={() => markPlayedMutation.mutate({ id: item.id })}
                      hideStatusBadge={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : playingGames.length > 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No playing games found on this page</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                <p className="text-lg">No games currently playing</p>
                <p className="text-sm">Mark games from your list as playing to see them here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayingPage() {
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
      <PlayingContent />
    </Suspense>
  );
}
