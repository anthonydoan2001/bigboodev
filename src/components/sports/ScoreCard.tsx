import { GameScore } from '@/types/sports';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Clock, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ScoreCardProps {
  game: GameScore;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: string) => void;
  isHoustonGame?: boolean;
}

export function ScoreCard({ game, isFavorite, onToggleFavorite, isHoustonGame }: ScoreCardProps) {
  // Track hydration to avoid server/client mismatch with date formatting
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const getStatusBadge = () => {
    switch (game.status) {
      case 'live':
        // Format quarter and time display
        let displayText = '';
        if (game.quarter && game.timeRemaining) {
          const quarter = game.quarter;
          const timeRemaining = game.timeRemaining.trim();
          
          // Check if it's 0.0 (end of quarter)
          if (timeRemaining === '0.0' || timeRemaining === '0:00') {
            // Special case for Q2 0.0 → Halftime
            if (quarter === 'Q2') {
              displayText = 'Halftime';
            } else {
              // For other quarters, show "End of QX"
              displayText = `End of ${quarter}`;
            }
          } else {
            // Normal time remaining
            displayText = `${quarter} ${timeRemaining}`;
          }
        } else if (game.quarter) {
          displayText = game.quarter;
        } else {
          displayText = 'LIVE';
        }
        
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-caption font-semibold tabular-nums">
            {displayText}
          </div>
        );
      case 'final':
        return <span className="text-caption font-semibold text-muted-foreground">FINAL</span>;
      case 'scheduled':
        // Use suppressHydrationWarning for time that varies between server/client
        return (
          <div className="flex items-center gap-1 text-caption text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span suppressHydrationWarning>
              {isHydrated ? (
                game.startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
              ) : (
                '\u00A0' // Non-breaking space to maintain layout
              )}
            </span>
          </div>
        );
    }
  };

  const isHomeWinning = game.homeScore > game.awayScore;
  const isAwayWinning = game.awayScore > game.homeScore;
  const isFinal = game.status === 'final';

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors bg-background">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            <span className="text-caption text-muted-foreground tracking-wide">
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
                className="p-1 hover:bg-muted/50 rounded-md transition-colors"
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
        <div className="p-4 space-y-4 bg-background">
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-body truncate ${isFinal && isAwayWinning ? 'font-bold' : 'font-medium'}`}>
                  {game.awayTeam}
                </span>
                {game.odds?.favorite === 'away' && game.status === 'scheduled' && (
                  <span className="text-caption text-muted-foreground whitespace-nowrap">
                    {game.odds.spread}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-heading tabular-nums font-mono ${isFinal && isAwayWinning ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
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
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-body truncate ${isFinal && isHomeWinning ? 'font-bold' : 'font-medium'}`}>
                  {game.homeTeam}
                </span>
                {game.odds?.favorite === 'home' && game.status === 'scheduled' && (
                  <span className="text-caption text-muted-foreground whitespace-nowrap">
                    {game.odds.spread}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-heading tabular-nums font-mono ${isFinal && isHomeWinning ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
              {game.status !== 'scheduled' ? game.homeScore : '-'}
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-background border-t border-border/50">
          {/* Game Status / Time */}
          {(game.status === 'live' || game.status === 'final') ? (
            game.odds?.spread ? (
              <div className="px-4 py-2 flex items-center justify-between text-caption min-h-[33px]">
                <span className="text-muted-foreground ml-auto">Spread: {game.odds.spread}</span>
              </div>
            ) : null
          ) : (
            <div className="px-4 py-3 text-center text-caption text-muted-foreground">
              <span suppressHydrationWarning>
                {isHydrated ? (
                  game.startTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                ) : (
                  '\u00A0' // Non-breaking space to maintain layout
                )}
              </span>
            </div>
          )}

          {/* Top Scorer Section - Distinct Row */}
          {game.sport === 'NBA' && game.topScorer && (game.status === 'live' || game.status === 'final') && (
            <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between gap-2 text-caption bg-background">
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
              <Badge variant="outline" className="h-5 px-1.5 bg-background border-border/50 font-mono text-caption">
                {game.topScorer.points} PTS
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

