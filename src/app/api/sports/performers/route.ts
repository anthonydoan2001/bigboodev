import { NextRequest, NextResponse } from 'next/server';
import { fetchTopPerformers } from '@/lib/api/sports';
import { SportType } from '@/types/sports';

export async function GET(request: NextRequest) {
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

    const performers = await fetchTopPerformers(sport, date);
    return NextResponse.json({ sport, performers });
  } catch (error) {
    console.error('Error in performers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top performers' },
      { status: 500 }
    );
  }
});

