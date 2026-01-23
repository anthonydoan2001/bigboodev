import { withAuth } from '@/lib/api-auth';
import { fetchAllScores, fetchScores } from '@/lib/api/sports';
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

    if (sport) {
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
      // This ensures live scores are always up-to-date
      const scores = await fetchScores(sport, queryDate);

      const response = NextResponse.json({
        sport,
        scores,
        cached: false,
        timestamp: new Date().toISOString(),
      });
      // Add cache control headers to prevent browser/CDN caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    // If no sport specified, fetch all
    // For this case, we'll fetch from API (could optimize later with cache)
    const allScores = await fetchAllScores();
    const response = NextResponse.json(allScores);
    // Add cache control headers to prevent browser/CDN caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error in scores API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
});

