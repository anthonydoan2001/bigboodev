import { TopPerformer } from '@/types/sports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface TopPerformersProps {
  performers: TopPerformer[];
  sport: string;
}

export function TopPerformersView({ performers, sport }: TopPerformersProps) {
  if (performers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No performance data available for today
        </CardContent>
      </Card>
    );
  }

  // Group performers by stat category
  const grouped: Record<string, TopPerformer[]> = {};

  performers.forEach((performer) => {
    Object.keys(performer.stats).forEach((statKey) => {
      const value = performer.stats[statKey];
      if (value !== undefined) {
        if (!grouped[statKey]) {
          grouped[statKey] = [];
        }
        grouped[statKey].push({
          ...performer,
          stats: { [statKey]: value },
        });
      }
    });
  });

  // Sort each category by stat value and take top performers
  Object.keys(grouped).forEach((statKey) => {
    grouped[statKey].sort((a, b) => {
      const aVal = a.stats[statKey] || 0;
      const bVal = b.stats[statKey] || 0;
      return bVal - aVal;
    });
    grouped[statKey] = grouped[statKey].slice(0, 5); // Top 5 per category
  });

  // Stat label mapping
  const statLabels: Record<string, string> = {
    points: 'Points',
    assists: 'Assists',
    rebounds: 'Rebounds',
    blocks: 'Blocks',
    steals: 'Steals',
    passingYards: 'Passing Yards',
    rushingYards: 'Rushing Yards',
    receivingYards: 'Receiving Yards',
    touchdowns: 'Touchdowns',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(grouped).map(([statKey, performers]) => (
        <Card key={statKey}>
          <CardHeader>
            <CardTitle className="text-lg">{statLabels[statKey] || statKey}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performers.map((performer, index) => {
                const statValue = performer.stats[statKey];
                return (
                  <div key={`${performer.name}-${index}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {performer.image && (
                        <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                          <Image
                            src={performer.image}
                            alt={performer.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{performer.name}</div>
                        <div className="text-xs text-muted-foreground">{performer.team}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {statValue}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

