import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameScore } from '@/types/sports';
import Image from 'next/image';

interface ScheduleViewProps {
  games: GameScore[];
}

export function ScheduleView({ games }: ScheduleViewProps) {
  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No upcoming games scheduled
        </CardContent>
      </Card>
    );
  }

  // Group games by date
  const groupedGames = games.reduce((acc, game) => {
    const dateKey = game.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(game);
    return acc;
  }, {} as Record<string, GameScore[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedGames).map(([date, dateGames]) => (
        <Card key={date} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold">{date}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {dateGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Away Team */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {game.awayTeamLogo ? (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={game.awayTeamLogo}
                            alt={game.awayTeam}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">
                            {game.awayTeam.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{game.awayTeam}</div>
                      </div>
                    </div>

                    {/* VS separator */}
                    <div className="text-muted-foreground font-medium text-xs px-2">@</div>

                    {/* Home Team */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {game.homeTeamLogo ? (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={game.homeTeamLogo}
                            alt={game.homeTeam}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">
                            {game.homeTeam.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{game.homeTeam}</div>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="ml-4 flex-shrink-0">
                    <div className="text-sm font-medium">
                      {game.startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    {game.startTime.toLocaleDateString() !== new Date().toLocaleDateString() && (
                      <div className="text-xs text-muted-foreground">
                        {game.startTime.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

