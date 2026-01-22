import { withAuth } from '@/lib/api-auth';
import { cacheTopPerformers, fetchTopPerformers, getCachedTopPerformers, hasLiveGames, isPerformersDataFresh } from '@/lib/api/sports';
import { db } from '@/lib/db';
import { SportType } from '@/types/sports';
import { NextRequest, NextResponse } from 'next/server';

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
    const cachedPerformers = await getCachedTopPerformers(sport, queryDate);

    // Check if we have cached data and if it's fresh
    if (cachedPerformers.length > 0) {
      // Get the most recent lastUpdated timestamp for this sport/date
      const year = queryDate.getFullYear();
      const month = queryDate.getMonth() + 1;
      const day = queryDate.getDate();
      const dateStr = new Date(year, month - 1, day);

      const mostRecent = await db.topPerformer.findFirst({
        where: {
          sport,
          date: dateStr,
        },
        orderBy: {
          lastUpdated: 'desc',
        },
        select: {
          lastUpdated: true,
        },
      });

      if (mostRecent) {
        const hasLive = await hasLiveGames(sport, queryDate);
        const isFresh = isPerformersDataFresh(mostRecent.lastUpdated, hasLive);

        if (isFresh) {
          // Return cached data
          return NextResponse.json({
            sport,
            performers: cachedPerformers,
            cached: true,
          });
        }
      }
    }

    // Cache miss or stale data - fetch from ESPN API
    const performers = await fetchTopPerformers(sport, queryDate);

    // Cache the fresh data for future requests (async, don't wait)
    cacheTopPerformers(sport, queryDate, performers).catch(err => {
      console.error('Error caching performers (non-blocking):', err);
    });

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

