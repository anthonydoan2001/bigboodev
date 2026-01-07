import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameScore } from '@/types/sports';

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
        <Card key={date}>
          <CardHeader>
            <CardTitle className="text-lg">{date}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dateGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{game.awayTeam}</div>
                    <div className="text-sm text-muted-foreground">@</div>
                    <div className="font-medium">{game.homeTeam}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {game.startTime.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
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

