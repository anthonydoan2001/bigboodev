import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuthOrCron } from '@/lib/api-auth';
import { getTopGames } from '@/lib/api/rawg';

interface TopGameData {
  id: string;
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  released: string | null;
  externalId: number;
}

/**
 * API route to refresh top games from RAWG API and store in database
 * This should be called by a cron job daily, or manually when needed
 * 
 * Refresh frequency: Daily (via cron)
 */
export const GET = withAuthOrCron(async (request: Request) => {
  try {
    // Check for force parameter (for manual testing or cron)
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    // Check if we should refresh
    // - Force: always refresh
    // - Daily: refresh if last update was more than 24 hours ago
    // - Frequent: refresh if last update was more than 5 minutes ago (for on-demand refreshes)
    let lastUpdated = null;
    try {
      lastUpdated = await db.topGame.findFirst({
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true },
      });
    } catch (error) {
      // If table doesn't exist or model not available, log and continue
      console.warn('Error checking lastUpdated, will proceed with refresh:', error);
    }

    const shouldRefresh = force || !lastUpdated || 
      (lastUpdated && (shouldRefreshDaily(lastUpdated.lastUpdated) || shouldRefreshFrequent(lastUpdated.lastUpdated)));
    
    if (!shouldRefresh && !force && lastUpdated) {
      const minutesSinceUpdate = (Date.now() - lastUpdated.lastUpdated.getTime()) / (1000 * 60);
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Already refreshed ${minutesSinceUpdate.toFixed(1)} minutes ago. Add ?force=true to bypass.`,
        lastUpdated: lastUpdated.lastUpdated.toISOString(),
        timestamp: new Date().toISOString(),
      });
    }

    console.log('Fetching top games from RAWG API...');
    
    // Fetch top games from RAWG API
    const rawgResults = await getTopGames(50);
    
    // Convert to TopGameData format
    const results: TopGameData[] = rawgResults.map(game => ({
      id: `game-${game.externalId}`,
      title: game.title,
      image: game.image,
      year: game.year,
      rating: game.rating,
      released: game.year ? `${game.year}-01-01` : null, // Use year as release date if available
      externalId: game.externalId,
    }));

    console.log(`Fetched ${results.length} top games. Storing in database...`);

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No games fetched from API',
        fetched: 0,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // Store in database using upsert
    const now = new Date();
    let created = 0;
    let updated = 0;
    let errors = 0;

    // Get existing items to track what's new vs updated
    let existingItems: Array<{ externalId: number }> = [];
    try {
      existingItems = await db.topGame.findMany({
        select: {
          externalId: true,
        },
      });
    } catch (error) {
      console.error('Error fetching existing items:', error);
      // Continue anyway - all items will be treated as new
    }
    const existingSet = new Set(
      existingItems.map(item => item.externalId)
    );

    for (const item of results) {
      try {
        const isNew = !existingSet.has(item.externalId);

        // Validate required fields
        if (!item.image || !item.rating || item.rating <= 0) {
          console.warn(`Skipping item ${item.id} - missing image or invalid rating`);
          continue;
        }

        await db.topGame.upsert({
          where: {
            externalId: item.externalId,
          },
          create: {
            id: item.id,
            title: item.title,
            imageUrl: item.image,
            rating: item.rating,
            released: item.released ?? null,
            externalId: item.externalId,
            lastUpdated: now,
          },
          update: {
            title: item.title,
            imageUrl: item.image,
            rating: item.rating,
            released: item.released ?? null,
            lastUpdated: now,
          },
        });
        
        if (isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        console.error(`Error upserting item ${item.id} (${item.title}):`, error);
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack);
        }
        errors++;
      }
    }

    // Clean up old items (items not in the current results)
    let deletedCount = 0;
    try {
      const currentIds = new Set(results.map(r => r.id));
      const deleted = await db.topGame.deleteMany({
        where: {
          NOT: {
            id: {
              in: Array.from(currentIds),
            },
          },
        },
      });
      deletedCount = deleted.count;
    } catch (error) {
      console.error('Error cleaning up old items:', error);
      // Don't fail the whole operation if cleanup fails
    }

    console.log(`Refresh complete: ${created} created, ${updated} updated, ${deletedCount} deleted, ${errors} errors`);

    return NextResponse.json({
      success: true,
      fetched: results.length,
      created,
      updated,
      deleted: deletedCount,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Top games refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh top games', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

/**
 * Check if we should refresh based on daily schedule
 * Refresh if last update was more than 24 hours ago
 */
function shouldRefreshDaily(lastUpdated: Date): boolean {
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate >= 24;
}

/**
 * Check if we should refresh based on frequent schedule (for on-demand refreshes)
 * Refresh if last update was more than 5 minutes ago
 */
function shouldRefreshFrequent(lastUpdated: Date): boolean {
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
  return minutesSinceUpdate >= 5;
}
