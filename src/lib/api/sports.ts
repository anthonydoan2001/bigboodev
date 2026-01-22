import { trackApiUsage } from '@/lib/api-usage';
import { db } from '@/lib/db';
import { GameScore, PlayoffRound, SportType, TopPerformer } from '@/types/sports';

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

    // Fetch games from 30 days ago to 400 days ahead to catch all playoff games
    // NFL playoffs typically run from early January to early February
    // Need to cover both current season and next season's playoffs (games can be scheduled a year ahead)
    const dateStrings: string[] = [];
    for (let i = -30; i < 400; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStrings.push(`${year}${month}${day}`);
    }

    // Split into chunks of 7 dates per request (to avoid URL length issues and rate limiting)
    // But prioritize January dates where playoffs typically occur
    const chunkSize = 7;
    const chunks: string[][] = [];

    // First, prioritize January dates (playoff month)
    const januaryDates: string[] = [];
    const otherDates: string[] = [];

    dateStrings.forEach(dateStr => {
      // Check if it's January (01) or February (02)
      const month = dateStr.substring(4, 6);
      if (month === '01' || month === '02') {
        januaryDates.push(dateStr);
      } else {
        otherDates.push(dateStr);
      }
    });

    // Create chunks prioritizing January dates
    const allPrioritizedDates = [...januaryDates, ...otherDates];
    for (let i = 0; i < allPrioritizedDates.length; i += chunkSize) {
      chunks.push(allPrioritizedDates.slice(i, i + chunkSize));
    }

    // Also fetch without dates to get current/recent playoff games
    // This helps catch games when date-based fetching misses them
    const noDateResponse = fetch(`${ESPN_BASE_URL}/${path}/scoreboard?limit=300`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Fetch all chunks in parallel with error handling
    const responses = await Promise.allSettled([
      noDateResponse,
      ...chunks.map(chunk => {
        const datesParam = chunk.join(',');
        return fetch(`${ESPN_BASE_URL}/${path}/scoreboard?dates=${datesParam}&limit=300`, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });
      })
    ]);

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

    // Filter for all remaining playoff games (scheduled or live)
    // Season type 3 = playoffs in ESPN API (1 = preseason, 2 = regular season, 3 = playoffs)
    // Also check notes for playoff indicators as a fallback
    const nowTime = now.getTime();
    const currentMonth = now.getMonth(); // 0-11, where 0 = January
    const isPlayoffSeason = currentMonth === 0 || currentMonth === 1; // Jan or Feb

    // First, try to identify playoff games
    let playoffGames = allGames
      .filter((event) => {
        if (!event.competitions || event.competitions.length === 0) return false;
        const competition = event.competitions[0];
        const gameDate = new Date(competition.date);

        // Check if it's a playoff game
        // Season type 3 = playoffs (check both event level and competition level)
        const eventSeasonType = event.season?.type;
        const competitionSeasonType = competition.season?.type;
        const seasonType = eventSeasonType || competitionSeasonType;
        const isPlayoffByType = seasonType === 3;

        // Check notes for playoff indicators (Wild Card, Divisional, Conference, Super Bowl)
        const notes = competition.notes || [];
        const hasPlayoffNote = notes.some(note => {
          const headline = note.headline?.toLowerCase() || '';
          return headline.includes('wild card') ||
                 headline.includes('divisional') ||
                 headline.includes('conference') ||
                 headline.includes('super bowl') ||
                 headline.includes('playoff');
        });

        const isPlayoff = isPlayoffByType || hasPlayoffNote;

        // Include scheduled (pre), live (in), and recently completed (post) games
        // For playoff games, include all scheduled/live games regardless of date
        // Include completed games from the last 30 days to show full bracket
        const statusState = event.status.type.state;
        const thirtyDaysAgo = nowTime - 30 * 24 * 60 * 60 * 1000;

        // For playoff games, be more lenient with dates - include all scheduled/live games
        // and completed games from last 30 days
        if (isPlayoff) {
          if (statusState === 'pre' || statusState === 'in') {
            return true; // Include all scheduled/live playoff games regardless of date
          }
          if (statusState === 'post' && gameDate.getTime() >= thirtyDaysAgo) {
            return true; // Include recently completed playoff games
          }
        }

        return false;
      });

    // If no playoff games found by type/notes, try filtering by date range during playoff season
    // NFL playoffs typically run from early January to early February
    // Also, if we're not in playoff season but have games with season type 3, include them
    if (playoffGames.length === 0) {
      // If no playoff games found by type/notes, try alternative detection
      // Check for season type 3 at event level (playoffs can be scheduled far in advance)
      const eventLevelPlayoffs = allGames.filter((event) => {
        if (!event.competitions || event.competitions.length === 0) return false;
        const eventSeasonType = event.season?.type;
        const competitionSeasonType = event.competitions[0]?.season?.type;
        const isPlayoffByType = eventSeasonType === 3 || competitionSeasonType === 3;

        if (!isPlayoffByType) return false;

        const competition = event.competitions[0];
        const gameDate = new Date(competition.date);
        const statusState = event.status.type.state;
        const thirtyDaysAgo = nowTime - 30 * 24 * 60 * 60 * 1000;

        // Include all scheduled/live playoff games, and recently completed ones
        if (statusState === 'pre' || statusState === 'in') {
          return true;
        }
        if (statusState === 'post' && gameDate.getTime() >= thirtyDaysAgo) {
          return true;
        }

        return false;
      });

      if (eventLevelPlayoffs.length > 0) {
        playoffGames = eventLevelPlayoffs;
      } else if (isPlayoffSeason) {
        // During playoff season, show all upcoming games as fallback
        playoffGames = allGames.filter((event) => {
          if (!event.competitions || event.competitions.length === 0) return false;
          const competition = event.competitions[0];
          const gameDate = new Date(competition.date);
          const statusState = event.status.type.state;
          const thirtyDaysAgo = nowTime - 30 * 24 * 60 * 60 * 1000;
          const isRecentOrUpcoming = (statusState === 'pre' || statusState === 'in') ||
                                     (statusState === 'post' && gameDate.getTime() >= thirtyDaysAgo);
          return isRecentOrUpcoming;
        });
      }
    }

    // Helper function to detect playoff round from notes and week number
    const detectPlayoffRound = (
      notes: Array<{ type?: string; headline?: string }> | undefined,
      weekNumber?: number,
      seasonType?: number
    ): PlayoffRound | undefined => {
      // Only check if it's a playoff game (season type 3)
      if (seasonType !== 3) return undefined;

      // Check notes first (most reliable)
      if (notes && notes.length > 0) {
        const headlineText = notes
          .map(n => n.headline?.toLowerCase() || '')
          .join(' ');

        if (headlineText.includes('super bowl')) {
          return 'Super Bowl';
        } else if (headlineText.includes('conference championship') || headlineText.includes('conference title')) {
          return 'Conference Championship';
        } else if (headlineText.includes('divisional')) {
          return 'Divisional';
        } else if (headlineText.includes('wild card')) {
          return 'Wild Card';
        }
      }

      // Fallback to week number if notes don't have round info
      // Week 1 = Wild Card, Week 2 = Divisional, Week 3 = Conference Championship, Week 5 = Super Bowl
      if (weekNumber !== undefined) {
        if (weekNumber === 1) return 'Wild Card';
        if (weekNumber === 2) return 'Divisional';
        if (weekNumber === 3) return 'Conference Championship';
        if (weekNumber === 5) return 'Super Bowl';
      }

      return undefined;
    };

    const mappedGames = playoffGames.map((event) => {
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

      // Detect playoff round from notes, week number, and season type
      const seasonType = event.season?.type || competition.season?.type;
      const weekNumber = event.week?.number;
      const playoffRound = detectPlayoffRound(competition.notes, weekNumber, seasonType);

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
        quarter: event.status.period ? `Q${event.status.period}` : undefined,
        timeRemaining: event.status.displayClock,
        startTime: new Date(competition.date),
        playoffRound,
      };
    }).sort((a, b) => {
      // Sort by round order first, then by date
      const roundOrder: Record<PlayoffRound, number> = {
        'Wild Card': 1,
        'Divisional': 2,
        'Conference Championship': 3,
        'Super Bowl': 4,
      };

      const aRound = a.playoffRound ? roundOrder[a.playoffRound] : 0;
      const bRound = b.playoffRound ? roundOrder[b.playoffRound] : 0;

      if (aRound !== bRound) {
        return aRound - bRound;
      }

      return a.startTime.getTime() - b.startTime.getTime();
    });

    // Remove duplicates by ID
    const uniqueGames = Array.from(
      new Map(mappedGames.map(game => [game.id, game])).values()
    );

    // Debug logging - always log to help diagnose issues
    console.log('Playoff games fetch summary:', {
      totalGamesFetched: allGames.length,
      playoffGamesFound: uniqueGames.length,
      currentDate: now.toISOString(),
      isPlayoffSeason,
      dateRange: `${dateStrings[0]} to ${dateStrings[dateStrings.length - 1]}`,
      chunksFetched: chunks.length,
    });

    if (uniqueGames.length === 0) {
      console.log('No playoff games found. Sample games:', allGames.slice(0, 5).map(e => ({
        id: e.id,
        eventSeasonType: e.season?.type,
        competitionSeasonType: e.competitions[0]?.season?.type,
        weekNumber: e.week?.number,
        status: e.status.type.state,
        date: e.competitions[0]?.date,
        notes: e.competitions[0]?.notes?.map(n => n.headline),
        teams: e.competitions[0]?.competitors?.map((c: any) => c.team.displayName),
      })));

      // Check if we have any games with season type 3
      const gamesWithSeasonType3 = allGames.filter(e =>
        e.season?.type === 3 || e.competitions[0]?.season?.type === 3
      );
      console.log(`Games with season type 3: ${gamesWithSeasonType3.length}`);
      if (gamesWithSeasonType3.length > 0) {
        console.log('Sample season type 3 games:', gamesWithSeasonType3.slice(0, 3).map(e => ({
          id: e.id,
          status: e.status.type.state,
          date: e.competitions[0]?.date,
          teams: e.competitions[0]?.competitors?.map((c: any) => c.team.displayName),
        })));
      }
    } else {
      console.log(`Found ${uniqueGames.length} playoff games`);
      console.log('Games by round:', uniqueGames.reduce((acc, g) => {
        acc[g.playoffRound || 'Unknown'] = (acc[g.playoffRound || 'Unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
    }

    return uniqueGames;
  } catch (error) {
    console.error(`Error fetching ${sport} playoff games:`, error);
    return []; // Return empty array instead of throwing
  }
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

