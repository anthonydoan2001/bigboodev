import { GameScore } from '@/types/sports';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Clock, Star } from 'lucide-react';

interface ScoreCardProps {
  game: GameScore;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: string) => void;
  isHoustonGame?: boolean;
}

export function ScoreCard({ game, isFavorite, onToggleFavorite, isHoustonGame }: ScoreCardProps) {
  const getStatusBadge = () => {
    switch (game.status) {
      case 'live':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold tabular-nums">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            {game.quarter} {game.timeRemaining}
          </div>
        );
      case 'final':
        return <span className="text-xs font-semibold text-muted-foreground">FINAL</span>;
      case 'scheduled':
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {game.startTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        );
    }
  };

  const isHomeWinning = game.homeScore > game.awayScore;
  const isAwayWinning = game.awayScore > game.homeScore;
  const isFinal = game.status === 'final';

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground tracking-wide">
              {game.sport}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(game.id);
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                title={isHoustonGame ? "Houston team (auto-favorited)" : isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star
                  className={`w-4 h-4 transition-colors ${
                    isFavorite
                      ? isHoustonGame
                        ? 'fill-orange-500 text-orange-500'
                        : 'fill-yellow-500 text-yellow-500'
                      : 'text-muted-foreground hover:text-yellow-500'
                  }`}
                />
              </button>
            )}
            {getStatusBadge()}
          </div>
        </div>

        {/* Teams & Scores */}
        <div className="p-4 space-y-4">
          {/* Away Team */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-10 h-10 flex-shrink-0">
                {game.awayTeamLogo ? (
                  <Image
                    src={game.awayTeamLogo}
                    alt={`${game.awayTeam} logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted/50" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-base truncate ${isFinal && isAwayWinning ? 'font-bold' : 'font-medium'}`}>
                  {game.awayTeam}
                </span>
                {game.odds?.favorite === 'away' && game.status === 'scheduled' && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {game.odds.spread}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-2xl tabular-nums tracking-tight ${isFinal && isAwayWinning ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
              {game.status !== 'scheduled' ? game.awayScore : '-'}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-10 h-10 flex-shrink-0">
                {game.homeTeamLogo ? (
                  <Image
                    src={game.homeTeamLogo}
                    alt={`${game.homeTeam} logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted/50" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-base truncate ${isFinal && isHomeWinning ? 'font-bold' : 'font-medium'}`}>
                  {game.homeTeam}
                </span>
                {game.odds?.favorite === 'home' && game.status === 'scheduled' && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {game.odds.spread}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-2xl tabular-nums tracking-tight ${isFinal && isHomeWinning ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
              {game.status !== 'scheduled' ? game.homeScore : '-'}
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-muted/10 border-t border-border/50">
          {/* Game Status / Time */}
          {(game.status === 'live' || game.status === 'final') ? (
            game.odds?.spread ? (
              <div className="px-4 py-2 flex items-center justify-between text-xs border-b border-border/50 last:border-0 min-h-[33px]">
                <span className="text-muted-foreground ml-auto">Spread: {game.odds.spread}</span>
              </div>
            ) : null
          ) : (
            <div className="px-4 py-3 text-center text-xs text-muted-foreground font-medium">
              {game.startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}

          {/* Top Scorer Section - Distinct Row */}
          {game.sport === 'NBA' && game.topScorer && (game.status === 'live' || game.status === 'final') && (
            <div className="px-4 py-2 bg-muted/20 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {game.topScorer.image && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-background border border-border/50">
                    <Image
                      src={game.topScorer.image}
                      alt={game.topScorer.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <span className="font-semibold text-foreground">{game.topScorer.name}</span>
              </div>
              <Badge variant="outline" className="h-5 px-1.5 bg-background border-border/50 font-mono">
                {game.topScorer.points} PTS
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

