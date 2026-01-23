import { withAuth } from '@/lib/api-auth';
import { cacheGameScores, fetchAllScores, fetchScores, getCachedGameScores } from '@/lib/api/sports';
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
      const validSports: SportType[] = ['NBA', 'NFL'];
      if (!validSports.includes(sport)) {
        return NextResponse.json(
          { error: 'Invalid sport type' },
          { status: 400 }
        );
      }

      // For NFL, always use today's date
      const queryDate = sport === 'NFL' ? new Date() : (date || new Date());

      // Check database cache first
      const cachedScores = await getCachedGameScores(sport, queryDate);

      // Check if we have sufficient cached data
      // For live games, we need non-expired data; for others, any cached data is fine
      const hasLiveGames = cachedScores.some(game => game.status === 'live');
      const hasFinalGames = cachedScores.some(game => game.status === 'final');
      const hasScheduledGames = cachedScores.some(game => game.status === 'scheduled');

      // If we have cached data, return it (cache refresh handles keeping it fresh)
      if (cachedScores.length > 0) {
        // For live games, verify they're not expired (getCachedGameScores already filters expired)
        // If we have any valid cached games, return them
        const response = NextResponse.json({
          sport,
          scores: cachedScores,
          cached: true,
          timestamp: new Date().toISOString(),
        });
        // Add cache control headers to prevent browser/CDN caching
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      }

      // Cache miss - fetch from ESPN API
      const scores = await fetchScores(sport, queryDate);

      // Cache the fresh data for future requests (async, don't wait)
      cacheGameScores(sport, queryDate, scores).catch(err => {
        console.error('Error caching scores (non-blocking):', err);
      });

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

