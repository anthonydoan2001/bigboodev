import { NextRequest, NextResponse } from 'next/server';
import { fetchUpcomingPlayoffGames } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { withAuth } from '@/lib/api-auth';

/**
 * Test endpoint to debug NFL playoff API issues
 * Returns detailed information about what games are found
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = (searchParams.get('sport') || 'NFL') as SportType;

    void 0; //('Testing NFL playoff API...');
    
    const games = await fetchUpcomingPlayoffGames(sport);
    
    // Also fetch raw data to see what we're getting
    const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';
    const now = new Date();
    const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    const testUrl = `${ESPN_BASE_URL}/football/nfl/scoreboard?dates=${todayStr}&limit=300`;
    const testResponse = await fetch(testUrl, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    
    let rawData = null;
    if (testResponse.ok) {
      rawData = await testResponse.json();
    }

    return NextResponse.json({
      success: true,
      sport,
      gamesFound: games.length,
      games,
      debug: {
        currentDate: now.toISOString(),
        testUrl,
        rawEventsCount: rawData?.events?.length || 0,
        sampleEvents: rawData?.events?.slice(0, 3).map((e: Record<string, unknown>) => ({
          id: e.id,
          status: (e.status as Record<string, unknown>)?.type as Record<string, unknown>,
          seasonType: ((e.competitions as Array<Record<string, unknown>>)?.[0]?.season as Record<string, unknown>)?.type,
          notes: ((e.competitions as Array<Record<string, unknown>>)?.[0]?.notes as Array<Record<string, unknown>>)?.map((n) => n.headline),
          date: (e.competitions as Array<Record<string, unknown>>)?.[0]?.date,
          teams: ((e.competitions as Array<Record<string, unknown>>)?.[0]?.competitors as Array<Record<string, unknown>>)?.map((c) => (c.team as Record<string, unknown>)?.displayName),
        })) || [],
      },
      troubleshooting: {
        checkDateRange: 'Playoff games typically run Jan-Feb. Current date is checked.',
        checkSeasonType: 'Season type 3 = playoffs. Check sampleEvents for actual values.',
        checkNotes: 'Games may have playoff keywords in notes field.',
        checkStatus: 'Only scheduled (pre) and live (in) games are shown.',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorStack,
    }, { status: 500 });
  }
});
