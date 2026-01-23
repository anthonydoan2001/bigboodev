'use client';

import { GameCard } from '@/components/games/GameCard';
import { GamesNav } from '@/components/games/GamesNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { useViewportGrid } from '@/lib/hooks/useViewportGrid';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function PlayingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { playingGames, isLoading } = useGames();
  const { deleteMutation, markPlayedMutation } = useGamesMutations();

  const { containerRef, itemsPerPage, isReady } = useViewportGrid({
    headerHeight: 160, // Nav + spacing
    footerHeight: 0, // No footer - pagination is in header
    maxCardWidth: 650, // Larger cards (will be clamped responsively)
    minCardWidth: 280, // Larger minimum (will be clamped responsively)
    cardAspectRatio: 9/16, // 16/9 aspect ratio (height/width)
  });

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

  // Paginate playing games
  const paginatedPlayingGames = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return playingGames.slice(startIndex, startIndex + itemsPerPage);
  }, [playingGames, page, itemsPerPage]);

  const totalPages = Math.ceil(playingGames.length / itemsPerPage);

  // Adjust page when itemsPerPage changes (e.g., on window resize)
  // Only redirect if we've mounted AND grid is ready to prevent initial flash
  useEffect(() => {
    if (!hasMounted || !isReady) return;

    if (totalPages > 0 && page > totalPages) {
      // Current page is invalid, redirect to last valid page
      const params = new URLSearchParams();
      params.set('page', totalPages.toString());
      router.replace(`/games/playing?${params.toString()}`);
    }
  }, [itemsPerPage, totalPages, page, router, hasMounted, isReady]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    router.push(`/games/playing?${params.toString()}`);
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
              <GamesNav />
            </Suspense>
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />}>
          <GamesNav />
        </Suspense>

        <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
          {/* Pagination Controls */}
          <div className="flex items-center justify-between min-h-[32px] sm:min-h-[36px] flex-shrink-0 flex-wrap gap-2">
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

          {/* Playing Results - Grid Layout */}
          {paginatedPlayingGames.length > 0 ? (
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <div ref={containerRef} className="games-grid gap-3 sm:gap-4 w-full h-full overflow-hidden" style={{ gridAutoRows: 'min-content' }}>
                {paginatedPlayingGames.map((item) => (
                  <div key={item.id} style={{ width: '100%', minWidth: 0 }}>
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
              <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
                <p className="text-sm sm:text-base">No playing games found on this page</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center text-muted-foreground space-y-3 sm:space-y-4">
                <p className="text-base sm:text-lg font-semibold">No games currently playing</p>
                <p className="text-xs sm:text-sm">Mark games from your list as playing to see them here</p>
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
      <div className="w-full h-screen flex flex-col py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 overflow-hidden">
        <div className="w-full flex flex-col h-full space-y-2 sm:space-y-3 md:space-y-4">
          <div className="h-10 w-full bg-muted animate-pulse rounded flex-shrink-0" />
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    }>
      <PlayingContent />
    </Suspense>
  );
}
