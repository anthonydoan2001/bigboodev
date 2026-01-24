import { trackApiUsage } from '@/lib/api-usage';
import { db } from '@/lib/db';
import { GameScore, PlayoffRound, SportType, TeamStanding, TopPerformer } from '@/types/sports';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// Sport league mappings for ESPN API
const SPORT_LEAGUES: Record<SportType, { league: string; path: string }> = {
  NBA: { league: 'nba', path: 'basketball/nba' },
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
  season?: {
    type?: number;
    year?: number;
  };
  week?: {
    number?: number;
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
      type?: string;
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

    const isSuccess = response.ok && response.status !== 429;
    await trackApiUsage('espn', {
      endpoint: `/${path}/scoreboard`,
      success: isSuccess,
      statusCode: response.status,
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
        quarter = `Q${event.status.period}`;
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
  // Playoff games feature is not currently available for NBA
  return [];
}

type ESPNPlayerStat = {
  athlete: {
    displayName: string;
    headshot?: string;
    team?: {
      abbreviation: string;
    };
  };
  stats?: Array<string>;
};

type ESPNStatistic = {
  team?: {
    abbreviation: string;
  };
  athletes?: Array<ESPNPlayerStat>;
};

type ESPNTeamStatistic = {
  name: string;
  displayName: string;
  athletes?: Array<{
    athlete: {
      displayName: string;
      headshot?: string;
    };
    stats?: Array<string>;
  }>;
};

interface ESPNBoxscoreResponse {
  boxscore?: {
    players?: {
      statistics?: Array<ESPNStatistic>;
    };
    teams?: Array<{
      team?: {
        abbreviation: string;
      };
      statistics?: Array<ESPNStatistic>;
    }>;
  };
  gamepackage?: {
    boxscore?: {
      teams?: Array<{
        team?: {
          abbreviation: string;
        };
        statistics?: Array<ESPNTeamStatistic>;
      }>;
      players?: {
        statistics?: Array<ESPNStatistic>;
      };
    };
  };
  // Summary endpoint might have different structure
  [key: string]: any;
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

    // Get all completed or live games
    const gamesToFetch = data.events.filter(
      (event) => event.status.type.state === 'in' || event.status.type.state === 'post'
    );

    if (gamesToFetch.length === 0) {
      return [];
    }

    const performersMap = new Map<string, TopPerformer>();

    // Fetch boxscores for all games with rate limiting (max 20 games, with delays)
    const boxscores: Array<{ event: ESPNGame; boxscoreData: ESPNBoxscoreResponse } | null> = [];

    for (let i = 0; i < Math.min(gamesToFetch.length, 20); i++) {
      const event = gamesToFetch[i];
      try {
        // Add small delay to avoid rate limiting (except for first request)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Try summary endpoint first (better structure for all players), fallback to scoreboard
        const summaryUrl = `${ESPN_BASE_URL}/${path}/summary/${event.id}`;
        let boxscoreResponse = await fetch(summaryUrl, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });

        // If summary fails, try scoreboard endpoint
        if (!boxscoreResponse.ok) {
          const boxscoreUrl = `${ESPN_BASE_URL}/${path}/scoreboard/${event.id}`;
          boxscoreResponse = await fetch(boxscoreUrl, {
            cache: 'no-store',
            headers: {
              'Accept': 'application/json',
            },
          });
        }

        if (!boxscoreResponse.ok) {
          continue;
        }

        const boxscoreData: ESPNBoxscoreResponse = await boxscoreResponse.json();
        boxscores.push({ event, boxscoreData });
      } catch (error) {
        console.error(`Error fetching boxscore for game ${event.id}:`, error);
        continue;
      }
    }

    // Extract all player stats from boxscores
    boxscores.forEach((result) => {
      if (!result) return;

      const { boxscoreData, event } = result;
      const competition = event.competitions[0];

      // Collect all unique players across all stat categories
      // The key insight: we need to iterate through ALL stat categories and collect ALL players
      // Each stat category might only have leaders, but together they should cover all players
      const allPlayersMap = new Map<string, { athlete: any; team: string; statsMap: Map<string, string[]> }>();

      // Try multiple structures to find all players
      // 1. boxscore.teams[].statistics (organized by team, might have all players)
      // 2. boxscore.players.statistics (organized by stat category, usually only leaders)
      // 3. gamepackage.boxscore.teams[].statistics
      // 4. gamepackage.boxscore.players.statistics

      // First, try boxscore.teams structure (might have all players per team)
      const boxscoreTeams = boxscoreData.boxscore?.teams;
      if (boxscoreTeams && Array.isArray(boxscoreTeams)) {
        boxscoreTeams.forEach((team) => {
          const teamAbbr = team.team?.abbreviation || '';
          team.statistics?.forEach((statCategory) => {
            statCategory.athletes?.forEach((athleteData) => {
              const athlete = athleteData.athlete;
              if (!athlete) return;

              const athleteName = athlete.displayName;
              if (!athleteName) return;

              const stats = athleteData.stats || [];
              const finalTeamAbbr = athlete.team?.abbreviation || teamAbbr;

              if (!allPlayersMap.has(athleteName)) {
                allPlayersMap.set(athleteName, {
                  athlete,
                  team: finalTeamAbbr,
                  statsMap: new Map(),
                });
              }

              const playerEntry = allPlayersMap.get(athleteName)!;
              if (stats.length >= 19 && (!playerEntry.statsMap.has('full') || playerEntry.statsMap.get('full')!.length < stats.length)) {
                playerEntry.statsMap.set('full', stats);
              }
            });
          });
        });
      }

      // Then try boxscore.players.statistics (stat categories, usually only leaders)
      const playersStats = boxscoreData.boxscore?.players?.statistics ||
                          boxscoreData.gamepackage?.boxscore?.players?.statistics;

      if (playersStats && playersStats.length > 0) {
        // For NBA, look for categories that have ALL players (not just leaders)
        // Categories like "minutes" or "fieldGoalsMade" typically have all players who played
        // Sort by number of athletes to prioritize categories with more players
        const sortedStats = [...playersStats].sort((a, b) => {
          const aCount = a.athletes?.length || 0;
          const bCount = b.athletes?.length || 0;
          return bCount - aCount; // Descending order
        });

        // Iterate through ALL stat categories to collect all players
        // Start with categories that have the most players (likely to have all players)
        sortedStats.forEach((statCategory) => {
          const teamAbbr = statCategory.team?.abbreviation || '';

          statCategory.athletes?.forEach((athleteData) => {
            const athlete = athleteData.athlete;
            if (!athlete) return;

            const athleteName = athlete.displayName;
            if (!athleteName) return;

            const stats = athleteData.stats || [];
            const finalTeamAbbr = athlete.team?.abbreviation || teamAbbr;

            // Get or create player entry
            if (!allPlayersMap.has(athleteName)) {
              allPlayersMap.set(athleteName, {
                athlete,
                team: finalTeamAbbr,
                statsMap: new Map(),
              });
            }

            const playerEntry = allPlayersMap.get(athleteName)!;

            // Store stats array - we'll use the longest/most complete one
            if (stats.length >= 19 && (!playerEntry.statsMap.has('full') || playerEntry.statsMap.get('full')!.length < stats.length)) {
              playerEntry.statsMap.set('full', stats);
            }
          });
        });

      }

      // Also try gamepackage.boxscore.teams structure
      if (boxscoreData.gamepackage?.boxscore?.teams) {
        boxscoreData.gamepackage.boxscore.teams.forEach((team) => {
          const teamAbbr = team.team?.abbreviation || '';

          team.statistics?.forEach((statCategory) => {
            statCategory.athletes?.forEach((athleteData) => {
              const athlete = athleteData.athlete;
              if (!athlete) return;

              const athleteName = athlete.displayName;
              if (!athleteName) return;

              const stats = athleteData.stats || [];
              const finalTeamAbbr = teamAbbr;

              if (!allPlayersMap.has(athleteName)) {
                allPlayersMap.set(athleteName, {
                  athlete,
                  team: finalTeamAbbr,
                  statsMap: new Map(),
                });
              }

              const playerEntry = allPlayersMap.get(athleteName)!;
              if (stats.length >= 19 && (!playerEntry.statsMap.has('full') || playerEntry.statsMap.get('full')!.length < stats.length)) {
                playerEntry.statsMap.set('full', stats);
              }
            });
          });
        });
      }

      // Process all collected players from all sources (only once, at the end)
      if (allPlayersMap.size > 0) {
        allPlayersMap.forEach((playerData, athleteName) => {
          const stats = playerData.statsMap.get('full') || [];
          const athlete = playerData.athlete;

          // Get or create performer entry
          let performer = performersMap.get(athleteName);
          if (!performer) {
            performer = {
              name: athleteName,
              team: playerData.team,
              image: athlete.headshot,
              stats: {},
            };
            performersMap.set(athleteName, performer);
          }

          // Parse stats based on sport
          if (sport === 'NBA') {
            // NBA stats array order: MIN, FGM, FGA, FG%, 3PM, 3PA, 3P%, FTM, FTA, FT%, OREB, DREB, REB, AST, STL, BLK, TO, PF, PTS
            if (stats.length >= 19) {
              const points = parseFloat(stats[18] || '0') || 0;
              const rebounds = parseFloat(stats[12] || '0') || 0;
              const assists = parseFloat(stats[13] || '0') || 0;
              const blocks = parseFloat(stats[15] || '0') || 0;
              const steals = parseFloat(stats[14] || '0') || 0;

              if (points > 0) performer.stats.points = (performer.stats.points || 0) + points;
              if (rebounds > 0) performer.stats.rebounds = (performer.stats.rebounds || 0) + rebounds;
              if (assists > 0) performer.stats.assists = (performer.stats.assists || 0) + assists;
              if (blocks > 0) performer.stats.blocks = (performer.stats.blocks || 0) + blocks;
              if (steals > 0) performer.stats.steals = (performer.stats.steals || 0) + steals;
            }
          } else if (sport === 'NFL') {
            // NFL stats parsing would go here
          }
        });
      }
    });

    // If we didn't get any performers from boxscores, fall back to leaders data
    if (performersMap.size === 0) {
      data.events.forEach((event) => {
        if (event.status.type.state === 'in' || event.status.type.state === 'post') {
          event.competitions[0].competitors.forEach((competitor) => {
            if (competitor.leaders) {
              competitor.leaders.forEach((leaderCategory) => {
                const categoryName = leaderCategory.name;

                leaderCategory.leaders.forEach((leaderData) => {
                  const athlete = leaderData.athlete;
                  const athleteName = athlete.displayName;

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

                  const statValue = parseFloat(leaderData.displayValue.replace(/[^\d.-]/g, ''));
                  if (isNaN(statValue)) return;

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
    }

    return Array.from(performersMap.values());
  } catch (error) {
    console.error(`Error fetching ${sport} top performers:`, error);
    return []; // Return empty array instead of throwing
  }
}

// Database caching helper functions

/**
 * Get cached game scores from database
 */
export async function getCachedGameScores(sport: SportType, date: Date): Promise<GameScore[]> {
  try {
    // Normalize date to UTC midnight to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // Create date at UTC midnight to match database DATE type
    const dateStr = new Date(Date.UTC(year, month - 1, day));

    const cachedGames = await db.gameScore.findMany({
      where: {
        sport,
        date: dateStr,
        OR: [
          { status: 'final' }, // Final games never expire
          { status: 'scheduled' }, // Scheduled games refresh daily
          {
            status: 'live',
            expiresAt: {
              gt: new Date(), // Live games must not be expired
            },
          },
        ],
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Convert database records to GameScore format
    return cachedGames.map((game): GameScore => ({
      id: game.gameId,
      sport: game.sport as SportType,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeTeamLogo: game.homeTeamLogo || undefined,
      awayTeamLogo: game.awayTeamLogo || undefined,
      status: game.status as 'scheduled' | 'live' | 'final',
      quarter: game.quarter || undefined,
      timeRemaining: game.timeRemaining || undefined,
      startTime: game.startTime,
      playoffRound: (game.playoffRound as PlayoffRound) || undefined,
      odds: game.odds ? (game.odds as GameScore['odds']) : undefined,
      topScorer: game.topScorer ? (game.topScorer as GameScore['topScorer']) : undefined,
    }));
  } catch (error) {
    console.error('Error getting cached game scores:', error);
    return [];
  }
}

/**
 * Cache game scores in database
 */
export async function cacheGameScores(sport: SportType, date: Date, games: GameScore[]): Promise<void> {
  try {
    // Normalize date to UTC midnight to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // Create date at UTC midnight to match database DATE type
    const dateStr = new Date(Date.UTC(year, month - 1, day));

    // Upsert each game
    for (const game of games) {
      const expiresAt = game.status === 'live'
        ? new Date(Date.now() + 60 * 1000) // Live games expire in 60 seconds
        : null; // Final and scheduled games don't expire

      await db.gameScore.upsert({
        where: {
          gameId_sport_date: {
            gameId: game.id,
            sport,
            date: dateStr,
          },
        },
        create: {
          gameId: game.id,
          sport,
          date: dateStr,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          homeTeamLogo: game.homeTeamLogo,
          awayTeamLogo: game.awayTeamLogo,
          status: game.status,
          quarter: game.quarter,
          timeRemaining: game.timeRemaining,
          startTime: game.startTime,
          playoffRound: game.playoffRound,
          odds: game.odds ? JSON.parse(JSON.stringify(game.odds)) : null,
          topScorer: game.topScorer ? JSON.parse(JSON.stringify(game.topScorer)) : null,
          expiresAt,
        },
        update: {
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          status: game.status,
          quarter: game.quarter,
          timeRemaining: game.timeRemaining,
          playoffRound: game.playoffRound,
          odds: game.odds ? JSON.parse(JSON.stringify(game.odds)) : null,
          topScorer: game.topScorer ? JSON.parse(JSON.stringify(game.topScorer)) : null,
          expiresAt,
          lastUpdated: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error caching game scores:', error);
    // Don't throw - caching failures shouldn't break the API
  }
}

/**
 * Check if there are live games for a sport and date
 */
export async function hasLiveGames(sport: SportType, date: Date): Promise<boolean> {
  try {
    // Normalize date to UTC midnight to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // Create date at UTC midnight to match database DATE type
    const dateStr = new Date(Date.UTC(year, month - 1, day));

    const liveGameCount = await db.gameScore.count({
      where: {
        sport,
        date: dateStr,
        status: 'live',
        expiresAt: {
          gt: new Date(), // Only count non-expired live games
        },
      },
    });

    return liveGameCount > 0;
  } catch (error) {
    console.error('Error checking for live games:', error);
    return false;
  }
}

/**
 * Clean up expired live game caches
 */
export async function cleanupExpiredLiveGames(): Promise<number> {
  try {
    const result = await db.gameScore.deleteMany({
      where: {
        status: 'live',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired live games:', error);
    return 0;
  }
}

/**
 * Get cached top performers from database
 */
export async function getCachedTopPerformers(sport: SportType, date: Date): Promise<TopPerformer[]> {
  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = new Date(year, month - 1, day);

    const cachedPerformers = await db.topPerformer.findMany({
      where: {
        sport,
        date: dateStr,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });

    // Convert database records to TopPerformer format
    return cachedPerformers.map((performer): TopPerformer => ({
      name: performer.name,
      team: performer.team,
      image: performer.imageUrl || undefined,
      stats: performer.stats as TopPerformer['stats'],
    }));
  } catch (error) {
    console.error('Error getting cached top performers:', error);
    return [];
  }
}

/**
 * Check if top performers data is fresh enough
 */
export function isPerformersDataFresh(lastUpdated: Date, hasLiveGames: boolean): boolean {
  const now = new Date();
  const ageMs = now.getTime() - lastUpdated.getTime();

  if (hasLiveGames) {
    // For live games, data must be < 10 minutes old
    return ageMs < 10 * 60 * 1000;
  } else {
    // For completed games, data can be up to 24 hours old
    return ageMs < 24 * 60 * 60 * 1000;
  }
}

/**
 * Cache top performers in database
 */
export async function cacheTopPerformers(sport: SportType, date: Date, performers: TopPerformer[]): Promise<void> {
  try {
    // Normalize date to UTC midnight to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // Create date at UTC midnight to match database DATE type
    const dateStr = new Date(Date.UTC(year, month - 1, day));

    // Upsert each performer
    for (const performer of performers) {
      await db.topPerformer.upsert({
        where: {
          sport_date_name: {
            sport,
            date: dateStr,
            name: performer.name,
          },
        },
        create: {
          sport,
          date: dateStr,
          name: performer.name,
          team: performer.team,
          imageUrl: performer.image,
          stats: JSON.parse(JSON.stringify(performer.stats)),
        },
        update: {
          team: performer.team,
          imageUrl: performer.image,
          stats: JSON.parse(JSON.stringify(performer.stats)),
          lastUpdated: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error caching top performers:', error);
    // Don't throw - caching failures shouldn't break the API
  }
}

/**
 * Fetch NBA standings from ESPN API
 */
export async function fetchStandings(sport: SportType): Promise<TeamStanding[]> {
  try {
    const { path } = SPORT_LEAGUES[sport];
    // Note: Standings endpoint uses /apis/v2/ instead of /apis/site/v2/
    const standingsBaseUrl = 'https://site.api.espn.com/apis/v2/sports';
    const url = `${standingsBaseUrl}/${path}/standings`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    await trackApiUsage('espn', {
      endpoint: `/${path}/standings`,
      success: response.ok,
      statusCode: response.status,
    });

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status} ${response.statusText}`);
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();

    // ESPN standings structure: data.children contains conferences
    // Each conference has standings array with team entries
    const standings: TeamStanding[] = [];

    if (data.children && Array.isArray(data.children)) {
      data.children.forEach((conference: any) => {
        const conferenceName = conference.name;
        const isEastern = conferenceName.toLowerCase().includes('east');
        const isWestern = conferenceName.toLowerCase().includes('west');

        if (conference.standings && conference.standings.entries) {
          const conferenceTeams: TeamStanding[] = [];

          conference.standings.entries.forEach((entry: any) => {
            const team = entry.team;
            const stats = entry.stats;

            // Find specific stats
            const wins = stats.find((s: any) => s.name === 'wins')?.value || 0;
            const losses = stats.find((s: any) => s.name === 'losses')?.value || 0;
            const winPercent = stats.find((s: any) => s.name === 'winPercent')?.value || 0;
            const streak = stats.find((s: any) => s.name === 'streak')?.displayValue || '-';
            
            // Find last 10 games stat - ESPN uses "Last Ten Games" with displayValue like "5-5"
            let last10Wins: number | undefined;
            let last10Losses: number | undefined;
            
            // Look for "Last Ten Games" stat (case-insensitive match)
            const lastTenGamesStat = stats.find((s: any) => 
              s.name === 'Last Ten Games' ||
              s.name?.toLowerCase() === 'last ten games' ||
              s.name?.toLowerCase().includes('last ten') ||
              s.name?.toLowerCase().includes('lastten')
            );
            
            if (lastTenGamesStat) {
              // Parse displayValue which is in format "W-L" (e.g., "5-5", "6-4")
              const recordValue = lastTenGamesStat.displayValue || lastTenGamesStat.value;
              if (typeof recordValue === 'string' && recordValue.includes('-')) {
                const parts = recordValue.split('-').map(p => p.trim());
                const wins = parseInt(parts[0]);
                const losses = parseInt(parts[1]);
                if (!isNaN(wins) && !isNaN(losses)) {
                  last10Wins = wins;
                  last10Losses = losses;
                }
              }
            }
            
            // Fallback: Try other variations if "Last Ten Games" not found
            if (last10Wins === undefined || last10Losses === undefined) {
              const lastTenRecordStat = stats.find((s: any) => 
                s.name === 'lastTen' || 
                s.name === 'lastTenRecord' ||
                s.name === 'last10Record' ||
                s.name === 'last10'
              );
              
              if (lastTenRecordStat) {
                const recordValue = lastTenRecordStat.displayValue || lastTenRecordStat.value;
                if (typeof recordValue === 'string' && recordValue.includes('-')) {
                  const parts = recordValue.split('-').map(p => p.trim());
                  const wins = parseInt(parts[0]);
                  const losses = parseInt(parts[1]);
                  if (!isNaN(wins) && !isNaN(losses)) {
                    last10Wins = wins;
                    last10Losses = losses;
                  }
                }
              }
            }

            conferenceTeams.push({
              rank: 0, // Will be assigned after sorting
              team: team.displayName || team.name,
              teamLogo: team.logos?.[0]?.href,
              wins: parseInt(wins),
              losses: parseInt(losses),
              winPercentage: parseFloat(winPercent),
              streak: streak,
              last10Wins,
              last10Losses,
              conference: isEastern ? 'Eastern' : isWestern ? 'Western' : 'Eastern',
            });
          });

          // Sort by win percentage (descending) - highest win % = rank 1
          conferenceTeams.sort((a, b) => b.winPercentage - a.winPercentage);

          // Assign ranks after sorting
          conferenceTeams.forEach((team, index) => {
            team.rank = index + 1;
            standings.push(team);
          });
        }
      });
    }

    return standings;
  } catch (error) {
    console.error(`Error fetching ${sport} standings:`, error);
    return []; // Return empty array instead of throwing
  }
}

export async function fetchAllScores(): Promise<Record<SportType, GameScore[]>> {
  const sports: SportType[] = ['NBA'];

  const results = await Promise.allSettled(
    sports.map(async (sport) => ({
      sport,
      scores: await fetchScores(sport),
    }))
  );

  const allScores: Record<SportType, GameScore[]> = {
    NBA: [],
  };

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allScores[result.value.sport] = result.value.scores;
    }
  });

  return allScores;
}

