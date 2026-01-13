import { NextRequest, NextResponse } from 'next/server';
import { fetchUpcomingPlayoffGames } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') as SportType | null;

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
    return NextResponse.json({ sport, games });
  } catch (error) {
    console.error('Error in playoffs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playoff games' },
      { status: 500 }
    );
  }
});
