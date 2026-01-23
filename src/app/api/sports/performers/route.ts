import { withAuth } from '@/lib/api-auth';
import { fetchTopPerformers } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - don't cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    } else {
      // Default to today if no date specified
      date = new Date();
    }

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport parameter is required' },
        { status: 400 }
      );
    }

    // Validate sport type
    const validSports: SportType[] = ['NBA'];
    if (!validSports.includes(sport)) {
      return NextResponse.json(
        { error: 'Invalid sport type' },
        { status: 400 }
      );
    }

    // Use provided date or today
    const queryDate = date || new Date();

    // Always fetch fresh data from ESPN (no database caching for live data)
    // This ensures live performer stats are always up-to-date
    const performers = await fetchTopPerformers(sport, queryDate);

    return NextResponse.json({
      sport,
      performers,
      cached: false,
    });
  } catch (error) {
    console.error('Error in performers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top performers' },
      { status: 500 }
    );
  }
});

