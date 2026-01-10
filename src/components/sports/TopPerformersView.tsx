import { TopPerformer } from '@/types/sports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
  const isNBA = sport === 'NBA';
  const topCount = isNBA ? 10 : 5; // Top 10 for NBA, Top 5 for others
  
  // Define priority order for NBA stats
  const statPriority = isNBA 
    ? ['points', 'rebounds', 'assists', 'blocks', 'steals'] 
    : ['passingYards', 'rushingYards', 'receivingYards', 'touchdowns'];

  const sortedStatKeys = Object.keys(grouped).sort((a, b) => {
    const aIdx = statPriority.indexOf(a);
    const bIdx = statPriority.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  sortedStatKeys.forEach((statKey) => {
    grouped[statKey].sort((a, b) => {
      const aVal = a.stats[statKey] || 0;
      const bVal = b.stats[statKey] || 0;
      return bVal - aVal;
    });
    grouped[statKey] = grouped[statKey].slice(0, topCount);
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
    <div className={cn(
      "grid gap-6",
      isNBA 
        ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    )}>
      {sortedStatKeys.map((statKey) => (
        <Card key={statKey} className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-md border-none shadow-none bg-transparent"
        )}>
          <CardHeader className="pb-3 px-4 flex flex-row justify-center">
            <CardTitle className={cn(
              "font-bold text-center",
              isNBA ? "text-2xl text-primary" : "text-xl"
            )}>
              {statLabels[statKey] || statKey}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 px-2">
              {grouped[statKey].map((performer, index) => {
                const statValue = performer.stats[statKey];
                const rank = index + 1;
                
                return (
                  <div 
                    key={`${performer.name}-${index}`} 
                    className="flex items-center justify-between gap-4 p-3 px-4 transition-all duration-200 rounded-xl hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-6 text-sm font-bold text-muted-foreground/60">
                        {rank}
                      </div>
                      
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "relative rounded-full overflow-hidden bg-muted transition-all",
                          isNBA ? "w-12 h-12" : "w-11 h-11"
                        )}>
                          {performer.image ? (
                            <Image
                              src={performer.image}
                              alt={performer.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                              <span className="text-xs font-bold">{performer.team}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate transition-all text-sm">
                          {performer.name}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <span className="font-semibold">{performer.team}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <div className={cn(
                        "font-black tabular-nums transition-all",
                        isNBA ? "text-xl text-primary" : "text-lg text-foreground/80"
                      )}>
                        {statValue}
                      </div>
                    </div>
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
