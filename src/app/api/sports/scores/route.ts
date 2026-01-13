import { NextRequest, NextResponse } from 'next/server';
import { fetchScores, fetchAllScores } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport') as SportType | null;
    const dateStr = searchParams.get('date');

    let date: Date | undefined;
    if (dateStr) {
      // Parse date string as YYYY-MM-DD in local time
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }

    if (sport) {
      // Validate sport type
      const validSports: SportType[] = ['NBA', 'NFL'];
      if (!validSports.includes(sport)) {
        return NextResponse.json(
          { error: 'Invalid sport type' },
          { status: 400 }
        );
      }

      const scores = await fetchScores(sport, date);
      return NextResponse.json({ sport, scores });
    }

    // If no sport specified, fetch all
    const allScores = await fetchAllScores();
    return NextResponse.json(allScores);
  } catch (error) {
    console.error('Error in scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
});

