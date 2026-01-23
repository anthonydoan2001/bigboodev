import { NextRequest, NextResponse } from 'next/server';
import { fetchStandings } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { withAuth } from '@/lib/api-auth';

// Force dynamic rendering - don't cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const validSports: SportType[] = ['NBA'];
    if (!validSports.includes(sport)) {
      return NextResponse.json(
        { error: 'Invalid sport type' },
        { status: 400 }
      );
    }

    const standings = await fetchStandings(sport);

    const response = NextResponse.json({
      sport,
      standings,
      timestamp: new Date().toISOString(),
    });

    // Add cache control headers to prevent browser/CDN caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error in standings API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
});
