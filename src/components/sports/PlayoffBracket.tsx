import { GameScore, PlayoffRound } from '@/types/sports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PlayoffBracketProps {
  games: GameScore[];
}

const ROUND_ORDER: PlayoffRound[] = ['Wild Card', 'Divisional', 'Conference Championship', 'Super Bowl'];

export function PlayoffBracket({ games }: PlayoffBracketProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No playoff games scheduled
        </CardContent>
      </Card>
    );
  }

  // Group games by playoff round
  const gamesByRound = games.reduce((acc, game) => {
    const round = game.playoffRound || 'Other';
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(game);
    return acc;
  }, {} as Record<string, GameScore[]>);

  // Sort games within each round by date
  Object.keys(gamesByRound).forEach(round => {
    gamesByRound[round].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  });

  return (
    <div className="space-y-8">
      {ROUND_ORDER.map((round) => {
        const roundGames = gamesByRound[round] || [];
        if (roundGames.length === 0) return null;

        return (
          <Card key={round} className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">{round}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roundGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Show any games without a round assigned */}
      {gamesByRound['Other'] && gamesByRound['Other'].length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Playoff Games</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {gamesByRound['Other'].map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GameCard({ game }: { game: GameScore }) {
  const dateStr = game.startTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  
  const timeStr = game.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  return (
    <div className={cn(
      "p-6 hover:bg-muted/50 transition-colors",
      isLive && "bg-green-500/10 border-l-4 border-l-green-500"
    )}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Teams */}
        <div className="flex-1 space-y-3">
          {/* Away Team */}
          <div className="flex items-center gap-4">
            {game.awayTeamLogo ? (
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={game.awayTeamLogo}
                  alt={game.awayTeam}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">
                  {game.awayTeam.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-semibold text-lg truncate",
                isFinal && game.awayScore > game.homeScore && "font-bold"
              )}>
                {game.awayTeam}
              </div>
              {isLive && (
                <div className="text-sm text-muted-foreground">
                  {game.awayScore > 0 ? `Score: ${game.awayScore}` : 'Away'}
                </div>
              )}
            </div>
            {(isFinal || isLive) && (
              <div className="text-2xl font-bold min-w-[3rem] text-right">
                {game.awayScore}
              </div>
            )}
          </div>

          {/* VS separator */}
          <div className="text-center text-muted-foreground text-sm font-medium px-2">
            @
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-4">
            {game.homeTeamLogo ? (
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={game.homeTeamLogo}
                  alt={game.homeTeam}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">
                  {game.homeTeam.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-semibold text-lg truncate",
                isFinal && game.homeScore > game.awayScore && "font-bold"
              )}>
                {game.homeTeam}
              </div>
              {isLive && (
                <div className="text-sm text-muted-foreground">
                  {game.homeScore > 0 ? `Score: ${game.homeScore}` : 'Home'}
                </div>
              )}
            </div>
            {(isFinal || isLive) && (
              <div className="text-2xl font-bold min-w-[3rem] text-right">
                {game.homeScore}
              </div>
            )}
          </div>
        </div>

        {/* Date, Time, and Status */}
        <div className="flex flex-col items-end gap-2 md:min-w-[180px]">
          <div className="text-right">
            <div className="font-semibold">{dateStr}</div>
            <div className="text-sm text-muted-foreground">{timeStr}</div>
          </div>
          
          {/* Status Badge */}
          <div className="flex gap-2">
            {isLive && (
              <>
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
                {game.quarter && (
                  <Badge variant="outline">
                    {game.quarter}
                  </Badge>
                )}
                {game.timeRemaining && (
                  <Badge variant="outline">
                    {game.timeRemaining}
                  </Badge>
                )}
              </>
            )}
            {game.status === 'scheduled' && (
              <Badge variant="secondary">
                Scheduled
              </Badge>
            )}
            {isFinal && (
              <Badge variant="outline">
                Final
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
