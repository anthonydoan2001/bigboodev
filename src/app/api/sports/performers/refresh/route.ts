import { NextResponse } from 'next/server';
import { fetchTopPerformers, hasLiveGames, cacheTopPerformers } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { withAuthOrCron } from '@/lib/api-auth';

/**
 * API route to refresh top performers from ESPN API and store in database
 * This should be called by a cron job every 10 minutes
 * 
 * Refresh strategy:
 * - Only refreshes when live games exist
 * - Stores daily snapshots
 * - Refreshes every 10 minutes when games are live
 */
export const GET = withAuthOrCron(async (request: Request, auth: { type: 'session' | 'cron'; token: string }) => {
  try {
    console.log(`[Top Performers Refresh] Called by ${auth.type} at ${new Date().toISOString()}`);

    // Check for force parameter (for manual testing)
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const sportParam = url.searchParams.get('sport') as SportType | null;

    const today = new Date();
    const sportsToCheck: SportType[] = sportParam ? [sportParam] : ['NBA', 'NFL'];

    // Check if there are live games
    const liveGamesBySport: Record<SportType, boolean> = {
      NBA: false,
      NFL: false,
    };

    for (const sport of sportsToCheck) {
      // For NFL, always use today's date; for other sports, use today
      const date = sport === 'NFL' ? new Date() : today;
      liveGamesBySport[sport] = await hasLiveGames(sport, date);
    }

    const hasAnyLiveGames = Object.values(liveGamesBySport).some(hasLive => hasLive);

    // If no live games and not forced, skip refresh
    if (!hasAnyLiveGames && !force) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No live games found. Top performers refresh only runs when games are live. Add ?force=true to bypass.',
        liveGamesBySport,
        timestamp: new Date().toISOString(),
      });
    }

    const results: Array<{ sport: SportType; count: number; hasLiveGames: boolean }> = [];
    const errors: Array<{ sport: SportType; error: string }> = [];

    // Fetch and cache performers for each sport with live games (or if forced)
    for (const sport of sportsToCheck) {
      // Only refresh if sport has live games or if forced
      if (!liveGamesBySport[sport] && !force) {
        console.log(`[Top Performers Refresh] Skipping ${sport} - no live games`);
        continue;
      }

      try {
        // For NFL, always use today's date; for other sports, use today
        const date = sport === 'NFL' ? new Date() : today;
        
        console.log(`[Top Performers Refresh] Fetching ${sport} performers for ${date.toISOString().split('T')[0]}`);
        
        // Fetch from ESPN API
        const performers = await fetchTopPerformers(sport, date);
        
        if (performers.length === 0) {
          console.log(`[Top Performers Refresh] No performers found for ${sport}`);
          results.push({ sport, count: 0, hasLiveGames: liveGamesBySport[sport] });
          continue;
        }

        // Cache performers in database
        await cacheTopPerformers(sport, date, performers);

        console.log(`[Top Performers Refresh] Cached ${performers.length} ${sport} performers`);
        
        results.push({
          sport,
          count: performers.length,
          hasLiveGames: liveGamesBySport[sport],
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Top Performers Refresh] Error refreshing ${sport}:`, errorMessage);
        errors.push({ sport, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
      liveGamesBySport,
    });
  } catch (error) {
    console.error('[Top Performers Refresh] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});
