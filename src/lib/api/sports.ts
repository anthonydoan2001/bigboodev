import { SportType, GameScore, TopPerformer } from '@/types/sports';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// Sport league mappings for ESPN API
const SPORT_LEAGUES: Record<SportType, { league: string; path: string }> = {
  NBA: { league: 'nba', path: 'basketball/nba' },
  NFL: { league: 'nfl', path: 'football/nfl' },
};

interface ESPNGame {
  id: string;
  status: {
    type: {
      state: string;
      completed: boolean;
    };
    displayClock?: string;
    period?: number;
  };
  competitions: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        abbreviation: string;
        logo?: string;
      };
      score: string;
      homeAway: 'home' | 'away';
      leaders?: Array<{
        name: string;
        displayName: string;
        leaders: Array<{
          displayValue: string;
          athlete: {
            displayName: string;
            headshot?: string;
            team?: {
              abbreviation: string;
            };
          };
        }>;
      }>;
    }>;
    date: string;
    notes?: Array<{
      headline?: string;
    }>;
    season?: {
      type?: number;
    };
    odds?: Array<{
      provider?: {
        name: string;
      };
      details?: string;
      overUnder?: number;
      spread?: number;
      awayTeamOdds?: {
        favorite?: boolean;
        underdog?: boolean;
      };
      homeTeamOdds?: {
        favorite?: boolean;
        underdog?: boolean;
      };
    }>;
  }>;
}

interface ESPNScoreboardResponse {
  events: ESPNGame[];
}

export async function fetchScores(sport: SportType, date?: Date): Promise<GameScore[]> {
  try {
    const { path } = SPORT_LEAGUES[sport];

    // Format date as YYYYMMDD for ESPN API (per documentation)
    const params = new URLSearchParams();
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      params.append('dates', `${year}${month}${day}`);
    }
    params.append('limit', '300'); // Get more results

    const url = `${ESPN_BASE_URL}/${path}/scoreboard?${params.toString()}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status} ${response.statusText}`);
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data: ESPNScoreboardResponse = await response.json();

    if (!data.events || data.events.length === 0) {
      return [];
    }

    return data.events.map((event) => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
      const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

      const statusState = event.status.type.state;
      let status: 'scheduled' | 'live' | 'final';

      if (statusState === 'pre') {
        status = 'scheduled';
      } else if (statusState === 'in') {
        status = 'live';
      } else {
        status = 'final';
      }

      // Extract betting odds (use first provider - usually consensus)
      let odds;
      if (competition.odds && competition.odds.length > 0) {
        const oddsData = competition.odds[0];
        let favorite: 'home' | 'away' | undefined;

        // Determine favorite based on spread (negative spread = favorite)
        const spreadValue = oddsData.spread;
        if (spreadValue !== undefined && spreadValue !== null) {
          // ESPN spread is typically shown for the favorite
          // Negative spread means favorite, positive means underdog
          if (oddsData.homeTeamOdds?.favorite) {
            favorite = 'home';
          } else if (oddsData.awayTeamOdds?.favorite) {
            favorite = 'away';
          }
        }

        // Format spread - show negative for favorite
        let spreadDisplay: string | undefined;
        if (spreadValue !== undefined && spreadValue !== null && favorite) {
          // Make sure spread is negative for favorite display
          const absSpread = Math.abs(spreadValue);
          spreadDisplay = `-${absSpread}`;
        }

        odds = {
          spread: spreadDisplay,
          overUnder: oddsData.overUnder !== undefined ? `O/U ${oddsData.overUnder}` : undefined,
          favorite,
          details: oddsData.details,
        };
      }

      // Get period label (Q1, Q2, etc.)
      let quarter: string | undefined;
      if (event.status.period) {
        if (sport === 'NBA' || sport === 'NFL') {
          quarter = `Q${event.status.period}`;
        } else {
          quarter = `Period ${event.status.period}`;
        }
      }

      // Extract top scorer for NBA (live and completed games)
      let topScorer;
      if (sport === 'NBA' && (status === 'live' || status === 'final')) {
        let maxPoints = -1;
        let topScorerInfo: { name: string; points: number; team: 'home' | 'away'; image?: string } | undefined;

        // Check leaders from both teams
        competition.competitors.forEach((competitor) => {
          if (competitor.leaders) {
            competitor.leaders.forEach((leaderCategory) => {
              // Look for scoring leaders
              if (leaderCategory.name === 'points' || leaderCategory.name === 'scoring') {
                leaderCategory.leaders.forEach((leader) => {
                  const points = parseFloat(leader.displayValue.replace(/[^\d.-]/g, ''));

                  if (!isNaN(points) && points > maxPoints) {
                    maxPoints = points;
                    topScorerInfo = {
                      name: leader.athlete.displayName,
                      points: points,
                      team: competitor.homeAway,
                      image: leader.athlete.headshot,
                    };
                  }
                });
              }
            });
          }
        });

        topScorer = topScorerInfo;
      }

      return {
        id: event.id,
        sport,
        homeTeam: homeTeam?.team.displayName || 'TBD',
        awayTeam: awayTeam?.team.displayName || 'TBD',
        homeTeamLogo: homeTeam?.team.logo,
        awayTeamLogo: awayTeam?.team.logo,
        homeScore: parseInt(homeTeam?.score || '0'),
        awayScore: parseInt(awayTeam?.score || '0'),
        status,
        quarter,
        timeRemaining: event.status.displayClock,
        startTime: new Date(competition.date),
        odds,
        topScorer,
      };
    });
  } catch (error) {
    console.error(`Error fetching ${sport} scores:`, error);
    return []; // Return empty array instead of throwing
  }
}

export async function fetchSchedule(sport: SportType, days: number = 7): Promise<GameScore[]> {
  try {
    const { path } = SPORT_LEAGUES[sport];
    const response = await fetch(`${ESPN_BASE_URL}/${path}/scoreboard`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    const data: ESPNScoreboardResponse = await response.json();

    // Filter for upcoming games within the specified days
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return data.events
      .filter((event) => {
        const gameDate = new Date(event.competitions[0].date);
        return gameDate >= now && gameDate <= futureDate && event.status.type.state === 'pre';
      })
      .map((event) => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
        const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

        return {
          id: event.id,
          sport,
          homeTeam: homeTeam?.team.displayName || 'TBD',
          awayTeam: awayTeam?.team.displayName || 'TBD',
          homeScore: 0,
          awayScore: 0,
          status: 'scheduled' as const,
          startTime: new Date(competition.date),
        };
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  } catch (error) {
    console.error(`Error fetching ${sport} schedule:`, error);
    throw error;
  }
}

export async function fetchUpcomingPlayoffGames(sport: SportType): Promise<GameScore[]> {
  try {
    if (sport !== 'NFL') {
      throw new Error('Playoff games are only available for NFL');
    }

    const { path } = SPORT_LEAGUES[sport];
    const now = new Date();
    
    // Fetch upcoming games for the next 45 days to catch all playoff games
    // NFL playoffs typically run from mid-January to early February
    const dateStrings: string[] = [];
    for (let i = 0; i < 45; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStrings.push(`${year}${month}${day}`);
    }
    
    // Split into chunks of 7 dates per request (to avoid URL length issues and rate limiting)
    const chunkSize = 7;
    const chunks: string[][] = [];
    for (let i = 0; i < dateStrings.length; i += chunkSize) {
      chunks.push(dateStrings.slice(i, i + chunkSize));
    }
    
    // Fetch all chunks in parallel with error handling
    const responses = await Promise.allSettled(
      chunks.map(chunk => {
        const datesParam = chunk.join(',');
        return fetch(`${ESPN_BASE_URL}/${path}/scoreboard?dates=${datesParam}&limit=300`, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });
      })
    );

    const allGames: ESPNGame[] = [];
    
    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value.ok) {
        try {
          const data: ESPNScoreboardResponse = await response.value.json();
          if (data.events && Array.isArray(data.events)) {
            allGames.push(...data.events);
          }
        } catch (e) {
          console.error('Error parsing playoff games response:', e);
        }
      } else if (response.status === 'rejected') {
        console.error('Error fetching playoff games chunk:', response.reason);
      }
    }

    // Filter for upcoming playoff games
    // Season type 3 = playoffs in ESPN API (1 = preseason, 2 = regular season, 3 = playoffs)
    const nowTime = now.getTime();
    
    const playoffGames = allGames
      .filter((event) => {
        if (!event.competitions || event.competitions.length === 0) return false;
        const competition = event.competitions[0];
        const gameDate = new Date(competition.date);
        const isPlayoff = competition.season?.type === 3;
        const isUpcoming = event.status.type.state === 'pre' && gameDate.getTime() >= nowTime;
        return isPlayoff && isUpcoming;
      })
      .map((event) => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
        const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

        return {
          id: event.id,
          sport,
          homeTeam: homeTeam?.team.displayName || 'TBD',
          awayTeam: awayTeam?.team.displayName || 'TBD',
          homeTeamLogo: homeTeam?.team.logo,
          awayTeamLogo: awayTeam?.team.logo,
          homeScore: 0,
          awayScore: 0,
          status: 'scheduled' as const,
          startTime: new Date(competition.date),
        };
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Remove duplicates by ID
    const uniqueGames = Array.from(
      new Map(playoffGames.map(game => [game.id, game])).values()
    );

    return uniqueGames;
  } catch (error) {
    console.error(`Error fetching ${sport} playoff games:`, error);
    return []; // Return empty array instead of throwing
  }
}

export async function fetchTopPerformers(sport: SportType, date?: Date): Promise<TopPerformer[]> {
  try {
    const { path } = SPORT_LEAGUES[sport];

    // Format date as YYYYMMDD for ESPN API (per documentation)
    const params = new URLSearchParams();
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      params.append('dates', `${year}${month}${day}`);
    }
    params.append('limit', '300');

    const url = `${ESPN_BASE_URL}/${path}/scoreboard?${params.toString()}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: ESPNScoreboardResponse = await response.json();

    if (!data.events || data.events.length === 0) {
      return [];
    }

    const performersMap = new Map<string, TopPerformer>();

    // Extract leaders from completed or live games
    data.events.forEach((event) => {
      if (event.status.type.state === 'in' || event.status.type.state === 'post') {
        event.competitions[0].competitors.forEach((competitor) => {
          if (competitor.leaders) {
            competitor.leaders.forEach((leaderCategory) => {
              // Check the category name (e.g., "passing", "rushing", "receiving", "points")
              const categoryName = leaderCategory.name;

              leaderCategory.leaders.forEach((leaderData) => {
                const athlete = leaderData.athlete;
                const athleteName = athlete.displayName;

                // Get or create performer entry
                let performer = performersMap.get(athleteName);
                if (!performer) {
                  performer = {
                    name: athleteName,
                    team: athlete.team?.abbreviation || competitor.team.abbreviation,
                    image: athlete.headshot,
                    stats: {},
                  };
                  performersMap.set(athleteName, performer);
                }

                // Parse the stat value
                const statValue = parseFloat(leaderData.displayValue.replace(/[^\d.-]/g, ''));
                if (isNaN(statValue)) return;

                // Map stats based on sport and category
                if (sport === 'NBA') {
                   // For NBA, existing logic works well
                   if (categoryName === 'points') performer.stats.points = statValue;
                   if (categoryName === 'rebounds') performer.stats.rebounds = statValue;
                   if (categoryName === 'assists') performer.stats.assists = statValue;
                } else if (sport === 'NFL') {
                   // For NFL, map based on category name
                   if (categoryName === 'passingYards') performer.stats.passingYards = statValue;
                   if (categoryName === 'rushingYards') performer.stats.rushingYards = statValue;
                   if (categoryName === 'receivingYards') performer.stats.receivingYards = statValue;
                }

                // General mapping fallback
                const statMapping: Record<string, keyof TopPerformer['stats']> = {
                  'passing': 'passingYards',
                  'passingYards': 'passingYards',
                  'rushing': 'rushingYards',
                  'rushingYards': 'rushingYards',
                  'receiving': 'receivingYards',
                  'receivingYards': 'receivingYards',
                  'points': 'points',
                  'rebounds': 'rebounds',
                  'assists': 'assists',
                  'blocks': 'blocks',
                  'steals': 'steals',
                };

                const mappedStat = statMapping[categoryName];
                if (mappedStat) {
                   performer.stats[mappedStat] = statValue;
                }
              });
            });
          }
        });
      }
    });

    return Array.from(performersMap.values());
  } catch (error) {
    console.error(`Error fetching ${sport} top performers:`, error);
    return []; // Return empty array instead of throwing
  }
}

export async function fetchAllScores(): Promise<Record<SportType, GameScore[]>> {
  const sports: SportType[] = ['NBA', 'NFL'];

  const results = await Promise.allSettled(
    sports.map(async (sport) => ({
      sport,
      scores: await fetchScores(sport),
    }))
  );

  const allScores: Record<SportType, GameScore[]> = {
    NBA: [],
    NFL: [],
  };

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allScores[result.value.sport] = result.value.scores;
    }
  });

  return allScores;
}

