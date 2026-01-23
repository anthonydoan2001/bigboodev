import { TeamStanding } from '@/types/sports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StandingsProps {
  standings: TeamStanding[];
}

export function Standings({ standings }: StandingsProps) {
  // Group by conference
  const easternConference = standings.filter(team => team.conference === 'Eastern');
  const westernConference = standings.filter(team => team.conference === 'Western');

  const renderConference = (teams: TeamStanding[], conferenceName: string) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{conferenceName} Conference</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-caption font-semibold text-muted-foreground w-12">#</th>
                <th className="px-4 py-3 text-left text-caption font-semibold text-muted-foreground">Team</th>
                <th className="px-4 py-3 text-center text-caption font-semibold text-muted-foreground">W</th>
                <th className="px-4 py-3 text-center text-caption font-semibold text-muted-foreground">L</th>
                <th className="px-4 py-3 text-center text-caption font-semibold text-muted-foreground">PCT</th>
                <th className="px-4 py-3 text-center text-caption font-semibold text-muted-foreground">Streak</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                const isWinStreak = team.streak.startsWith('W');
                const isLossStreak = team.streak.startsWith('L');

                return (
                  <tr
                    key={team.team}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-body-sm font-semibold text-muted-foreground">
                      {team.rank}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {team.teamLogo && (
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <Image
                              src={team.teamLogo}
                              alt={`${team.team} logo`}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <span className="text-body font-medium truncate">{team.team}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-body font-semibold tabular-nums">
                      {team.wins}
                    </td>
                    <td className="px-4 py-3 text-center text-body font-semibold tabular-nums">
                      {team.losses}
                    </td>
                    <td className="px-4 py-3 text-center text-body-sm tabular-nums text-muted-foreground">
                      {team.winPercentage.toFixed(3)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {isWinStreak && (
                          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        )}
                        {isLossStreak && (
                          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className={`text-body-sm font-semibold tabular-nums ${
                          isWinStreak ? 'text-green-600 dark:text-green-500' :
                          isLossStreak ? 'text-red-600 dark:text-red-500' :
                          'text-muted-foreground'
                        }`}>
                          {team.streak}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (standings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-body-sm text-muted-foreground">
            No standings data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {easternConference.length > 0 && renderConference(easternConference, 'Eastern')}
      {westernConference.length > 0 && renderConference(westernConference, 'Western')}
    </div>
  );
}
