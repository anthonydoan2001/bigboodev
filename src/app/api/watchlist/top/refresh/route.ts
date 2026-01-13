import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

interface TopItemData {
  id: string;
  type: 'anime' | 'movie' | 'show';
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  episodes?: number | null;
  externalId: number;
}

/**
 * API route to refresh top items from external APIs and store in database
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
      lastUpdated = await db.topItem.findFirst({
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

    console.log('Fetching top items from external APIs...');
    const results: TopItemData[] = [];

    // Fetch top items from all sources in parallel with error handling
    let animeResponse1: Response | null = null;
    let animeResponse2: Response | null = null;
    let moviesResponse: Response | null = null;
    let tvResponse: Response | null = null;

    try {
      [animeResponse1, animeResponse2, moviesResponse, tvResponse] = await Promise.all([
        fetch(`${JIKAN_BASE_URL}/top/anime?limit=25&page=1`).catch(err => {
          console.error('Error fetching anime page 1:', err);
          return null;
        }),
        fetch(`${JIKAN_BASE_URL}/top/anime?limit=25&page=2`).catch(err => {
          console.error('Error fetching anime page 2:', err);
          return null;
        }),
        TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1`).catch(err => {
          console.error('Error fetching movies:', err);
          return null;
        }) : Promise.resolve(null),
        TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=1`).catch(err => {
          console.error('Error fetching TV shows:', err);
          return null;
        }) : Promise.resolve(null),
      ]);
    } catch (error) {
      console.error('Error fetching from APIs:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch from external APIs',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // Parse anime results from multiple pages
    const parseAnimeResponse = async (response: Response | null): Promise<TopItemData[]> => {
      if (!response || !response.ok) {
        return [];
      }
      try {
        const animeData = await response.json();
        const animeList = animeData?.data || animeData || [];
        if (Array.isArray(animeList)) {
          const validItems: TopItemData[] = [];
          animeList.forEach((anime: any) => {
            const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            const rating = anime.score;
            
            // Filter out hentai content
            const isHentai = 
              anime.rating === 'Rx' || 
              anime.rating === 'R+ - Mild Nudity' ||
              (anime.genres && anime.genres.some((g: any) => 
                g.name?.toLowerCase().includes('hentai') || 
                g.name?.toLowerCase() === 'hentai'
              )) ||
              (anime.explicit_genres && anime.explicit_genres.some((g: any) => 
                g.name?.toLowerCase().includes('hentai') || 
                g.name?.toLowerCase() === 'hentai'
              ));
            
            if (imageUrl && rating && rating > 0 && !isHentai) {
              validItems.push({
                id: `anime-${anime.mal_id}`,
                type: 'anime' as const,
                title: anime.title,
                image: imageUrl,
                year: anime.year,
                rating: rating,
                episodes: anime.episodes,
                externalId: anime.mal_id,
              });
            }
          });
          return validItems;
        }
      } catch (error) {
        console.error('Error parsing anime response:', error);
      }
      return [];
    };

    const [animePage1, animePage2] = await Promise.all([
      parseAnimeResponse(animeResponse1),
      parseAnimeResponse(animeResponse2),
    ]);

    results.push(...animePage1, ...animePage2);

    // Parse movie results - fetch multiple pages
    if (moviesResponse && moviesResponse.ok) {
      const moviesData = await moviesResponse.json();
      const additionalPages = TMDB_API_KEY ? await Promise.all([
        fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=2`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=3`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]) : [];
      
      const allMovies = [
        ...moviesData.results,
        ...additionalPages.flatMap((page: any) => page?.results || [])
      ];
      
      allMovies.slice(0, 50).forEach((movie: any) => {
        const rating = movie.vote_average;
        if (movie.poster_path && rating && rating > 0) {
          results.push({
            id: `movie-${movie.id}`,
            type: 'movie',
            title: movie.title,
            image: `https://image.tmdb.org/t/p/w342${movie.poster_path}`,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            rating: rating,
            externalId: movie.id,
          });
        }
      });
    }

    // Parse TV results - fetch multiple pages
    if (tvResponse && tvResponse.ok) {
      const tvData = await tvResponse.json();
      const additionalPages = TMDB_API_KEY ? await Promise.all([
        fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=2`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=3`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]) : [];
      
      const allShows = [
        ...tvData.results,
        ...additionalPages.flatMap((page: any) => page?.results || [])
      ];
      
      allShows.slice(0, 50).forEach((show: any) => {
        const rating = show.vote_average;
        if (show.poster_path && rating && rating > 0) {
          results.push({
            id: `show-${show.id}`,
            type: 'show',
            title: show.name,
            image: `https://image.tmdb.org/t/p/w342${show.poster_path}`,
            year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
            rating: rating,
            externalId: show.id,
          });
        }
      });
    }

    console.log(`Fetched ${results.length} top items. Storing in database...`);

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items fetched from APIs',
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
    let existingItems: Array<{ externalId: number; type: string }> = [];
    try {
      existingItems = await db.topItem.findMany({
        select: {
          externalId: true,
          type: true,
        },
      });
    } catch (error) {
      console.error('Error fetching existing items:', error);
      // Continue anyway - all items will be treated as new
    }
    const existingSet = new Set(
      existingItems.map(item => `${item.externalId}-${item.type}`)
    );

    for (const item of results) {
      try {
        const itemKey = `${item.externalId}-${item.type}`;
        const isNew = !existingSet.has(itemKey);

        // Validate required fields
        if (!item.image || !item.rating || item.rating <= 0) {
          console.warn(`Skipping item ${item.id} - missing image or invalid rating`);
          continue;
        }

        await db.topItem.upsert({
          where: {
            externalId_type: {
              externalId: item.externalId,
              type: item.type,
            },
          },
          create: {
            id: item.id,
            type: item.type,
            title: item.title,
            imageUrl: item.image,
            year: item.year ?? null,
            rating: item.rating,
            episodes: item.episodes ?? null,
            externalId: item.externalId,
            lastUpdated: now,
          },
          update: {
            title: item.title,
            imageUrl: item.image,
            year: item.year ?? null,
            rating: item.rating,
            episodes: item.episodes ?? null,
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
      const deleted = await db.topItem.deleteMany({
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
    console.error('Top items refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh top items', details: error instanceof Error ? error.message : 'Unknown error' },
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
