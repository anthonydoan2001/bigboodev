'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GamesNav } from '@/components/games/GamesNav';
import { GameCard } from '@/components/games/GameCard';
import { GameCardSkeleton } from '@/components/games/GameCardSkeleton';
import { useGames } from '@/lib/hooks/useGames';
import { useGamesMutations } from '@/lib/hooks/useGamesMutations';
import { Loader2 } from 'lucide-react';

function PlayingContent() {
  const { playingGames, isLoading } = useGames();
  const { updateStatusMutation, deleteGameMutation } = useGamesMutations();

  return (
    <div className="w-full py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 lg:px-6 min-h-screen">
      <div className="w-full space-y-4 sm:space-y-6">
        <GamesNav />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : playingGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {playingGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onDelete={() => deleteGameMutation.mutate(game.id)}
                onMarkPlayed={() => updateStatusMutation.mutate({ id: game.id, status: 'PLAYED' })}
                onMoveToPlaylist={() => updateStatusMutation.mutate({ id: game.id, status: 'PLAYLIST' })}
                hideStatusBadge
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground space-y-4">
              <p className="text-title">No games currently playing</p>
              <p className="text-body-sm">Games you&apos;re currently playing will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PlayingPage() {
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
      <PlayingContent />
    </Suspense>
  );
}
