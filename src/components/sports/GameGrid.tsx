import { ScoreCard } from '@/components/sports/ScoreCard';
import { ScoreCardSkeleton } from '@/components/sports/ScoreCardSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { isHoustonGame } from '@/lib/favorites';
import { GameScore } from '@/types/sports';

interface GameGridProps {
  games: GameScore[];
  isLoading: boolean;
  error: Error | null;
  favorites: string[];
  onToggleFavorite: (gameId: string) => void;
  emptyMessage: string;
  errorMessage: string;
  skeletonCount?: number;
}

export function GameGrid({
  games,
  isLoading,
  error,
  favorites,
  onToggleFavorite,
  emptyMessage,
  errorMessage,
  skeletonCount = 8,
}: GameGridProps) {
  if (isLoading) {
    return (
      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <ScoreCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-body-sm text-destructive">
            {errorMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-body-sm text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => (
          <ScoreCard
            key={game.id}
            game={game}
            isFavorite={favorites.includes(game.id)}
            onToggleFavorite={onToggleFavorite}
            isHoustonGame={isHoustonGame(game.homeTeam, game.awayTeam)}
          />
        ))}
      </div>
    </div>
  );
}
