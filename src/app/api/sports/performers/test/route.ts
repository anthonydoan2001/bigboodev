import { NextRequest, NextResponse } from 'next/server';
import { SportType } from '@/types/sports';
import { withAuth } from '@/lib/api-auth';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = (searchParams.get('sport') || 'NBA') as SportType;
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: 'gameId parameter required' }, { status: 400 });
    }

    const path = sport === 'NBA' ? 'basketball/nba' : 'football/nfl';

    // Try summary endpoint
    const summaryUrl = `${ESPN_BASE_URL}/${path}/summary/${gameId}`;
    const summaryResponse = await fetch(summaryUrl, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    let summaryData = null;
    if (summaryResponse.ok) {
      summaryData = await summaryResponse.json();
    }

    // Try scoreboard endpoint
    const scoreboardUrl = `${ESPN_BASE_URL}/${path}/scoreboard/${gameId}`;
    const scoreboardResponse = await fetch(scoreboardUrl, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    let _scoreboardData = null;
    if (scoreboardResponse.ok) {
      _scoreboardData = await scoreboardResponse.json();
    }

    // Extract key structures to inspect
    const summaryStructure = {
      hasBoxscore: !!summaryData?.boxscore,
      hasGamepackage: !!summaryData?.gamepackage,
      boxscoreKeys: summaryData?.boxscore ? Object.keys(summaryData.boxscore) : [],
      gamepackageKeys: summaryData?.gamepackage ? Object.keys(summaryData.gamepackage) : [],
      boxscorePlayersStats: summaryData?.boxscore?.players?.statistics?.length || 0,
      gamepackageBoxscorePlayersStats: summaryData?.gamepackage?.boxscore?.players?.statistics?.length || 0,
      gamepackageBoxscoreTeamsStats: summaryData?.gamepackage?.boxscore?.teams?.length || 0,
      samplePlayersStats: summaryData?.boxscore?.players?.statistics?.[0] ? {
        team: summaryData.boxscore.players.statistics[0].team?.abbreviation,
        athletesCount: summaryData.boxscore.players.statistics[0].athletes?.length || 0,
        sampleAthlete: summaryData.boxscore.players.statistics[0].athletes?.[0] ? {
          name: summaryData.boxscore.players.statistics[0].athletes[0].athlete?.displayName,
          statsLength: summaryData.boxscore.players.statistics[0].athletes[0].stats?.length || 0,
        } : null,
      } : null,
    };

    return NextResponse.json({
      success: true,
      gameId,
      sport,
      summaryUrl,
      scoreboardUrl,
      summaryStatus: summaryResponse.status,
      scoreboardStatus: scoreboardResponse.status,
      structure: summaryStructure,
      // Include full response for debugging (truncated)
      fullSummaryData: summaryData ? JSON.stringify(summaryData).substring(0, 5000) : null,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});
