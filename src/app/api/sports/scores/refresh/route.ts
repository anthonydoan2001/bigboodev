import { withAuthOrCron } from '@/lib/api-auth';
import { cacheGameScores, cleanupExpiredLiveGames, fetchScores } from '@/lib/api/sports';
import { SportType } from '@/types/sports';
import { NextResponse } from 'next/server';

/**
 * API route to refresh game scores from ESPN API and store in database
 * This should be called by a cron job every 60 seconds
 *
 * Refresh strategy:
 * - Final games: Store indefinitely (no expiration)
 * - Scheduled games: Store and refresh daily
 * - Live games: Store with 60-second expiration
 */
export const GET = withAuthOrCron(async (request: Request, _auth: { type: 'session' | 'cron'; token: string }) => {
  try {
    void 0; //(`[Sports Scores Refresh] Called by ${auth.type} at ${new Date().toISOString()}`);

    // Check for force parameter (for manual testing)
    const url = new URL(request.url);
    const _force = url.searchParams.get('force') === 'true';
    const sportParam = url.searchParams.get('sport') as SportType | null;

    // Clean up expired live games first
    const deletedCount = await cleanupExpiredLiveGames();
    if (deletedCount > 0) {
      void 0; //(`[Sports Scores Refresh] Cleaned up ${deletedCount} expired live games`);
    }

    // Determine which sports to refresh
    const sportsToRefresh: SportType[] = sportParam
      ? [sportParam]
      : ['NBA']; // Refresh NBA by default

    const results: Array<{ sport: SportType; count: number; statuses: Record<string, number> }> = [];
    const errors: Array<{ sport: SportType; error: string }> = [];

    const today = new Date();

    // Fetch and cache scores for each sport
    for (const sport of sportsToRefresh) {
      try {
        void 0; //(`[Sports Scores Refresh] Fetching ${sport} scores for ${today.toISOString().split('T')[0]}`);

        // Fetch from ESPN API
        const games = await fetchScores(sport, today);

        if (games.length === 0) {
          void 0; //(`[Sports Scores Refresh] No games found for ${sport}`);
          results.push({ sport, count: 0, statuses: {} });
          continue;
        }

        // Cache games in database
        await cacheGameScores(sport, today, games);

        // Count games by status
        const statuses: Record<string, number> = {};
        games.forEach(game => {
          statuses[game.status] = (statuses[game.status] || 0) + 1;
        });

        void 0; //(`[Sports Scores Refresh] Cached ${games.length} ${sport} games:`, statuses);

        results.push({
          sport,
          count: games.length,
          statuses,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        void 0; //(`[Sports Scores Refresh] Error refreshing ${sport}:`, errorMessage);
        errors.push({ sport, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
      cleanedUpExpired: deletedCount,
    });
  } catch (error) {
    void 0; //('[Sports Scores Refresh] Fatal error:', error);
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
