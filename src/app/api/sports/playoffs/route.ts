import { NextRequest, NextResponse } from 'next/server';
import { fetchUpcomingPlayoffGames } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') as SportType | null;
    const debug = searchParams.get('debug') === 'true';

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      );
    }

    // Validate sport type
    const validSports: SportType[] = ['NBA', 'NFL'];
    if (!validSports.includes(sport)) {
      return NextResponse.json(
        { error: 'Invalid sport type' },
        { status: 400 }
      );
    }

    const games = await fetchUpcomingPlayoffGames(sport);
    
    const response: any = { sport, games };
    
    // Include debug info if requested
    if (debug) {
      response.debug = {
        gamesFound: games.length,
        currentDate: new Date().toISOString(),
        gamesWithRounds: games.filter(g => g.playoffRound).length,
        roundsFound: [...new Set(games.map(g => g.playoffRound).filter(Boolean))],
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in playoffs API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch playoff games',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
});
