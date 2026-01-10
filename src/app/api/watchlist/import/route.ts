import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseLetterboxdCSV, parseMALXML, ParsedItem } from '@/lib/import/parsers';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

interface ImportResult {
  success: number;
  duplicates: number;
  failed: number;
  errors: string[];
  skipped: number;
}

// Rate limiting helper - wait between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search TMDB for a movie by title and year
async function searchTMDBMovie(title: string, year?: number): Promise<{
  id: number;
  title: string;
  imageUrl: string | null;
  year: number | null;
  rating: number | null;
} | null> {
  try {
    let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    if (year) {
      url += `&year=${year}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;
    
    // Find best match (prefer exact year match)
    let bestMatch = data.results[0];
    if (year) {
      const exactMatch = data.results.find((r: any) => {
        const releaseYear = r.release_date ? parseInt(r.release_date.split('-')[0], 10) : null;
        return releaseYear === year;
      });
      if (exactMatch) bestMatch = exactMatch;
    }
    
    const releaseYear = bestMatch.release_date ? parseInt(bestMatch.release_date.split('-')[0], 10) : null;
    
    return {
      id: bestMatch.id,
      title: bestMatch.title,
      imageUrl: bestMatch.poster_path ? `https://image.tmdb.org/t/p/w342${bestMatch.poster_path}` : null,
      year: releaseYear,
      rating: bestMatch.vote_average || null,
    };
  } catch (error) {
    console.error(`TMDB search error for "${title}":`, error);
    return null;
  }
}

// Search Jikan for anime by MAL ID or title
async function searchJikanAnime(malId?: string, title?: string): Promise<{
  id: number;
  title: string;
  imageUrl: string | null;
  year: number | null;
  rating: number | null;
  episodes: number | null;
} | null> {
  try {
    let data: any;
    
    // If we have MAL ID, use it directly
    if (malId) {
      const response = await fetch(`${JIKAN_BASE_URL}/anime/${malId}`);
      if (response.ok) {
        const result = await response.json();
        data = result.data;
      }
    }
    
    // Fallback to title search
    if (!data && title) {
      const response = await fetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(title)}&limit=1`);
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          data = result.data[0];
        }
      }
    }
    
    if (!data) return null;
    
    const year = data.aired?.from ? parseInt(data.aired.from.split('-')[0], 10) : null;
    
    return {
      id: data.mal_id,
      title: data.title,
      imageUrl: data.images?.jpg?.image_url || null,
      year,
      rating: data.score || null,
      episodes: data.episodes || null,
    };
  } catch (error) {
    console.error(`Jikan search error for "${title || malId}":`, error);
    return null;
  }
}

// Import a single item to the database
async function importItem(
  item: ParsedItem,
  metadata: { id: number; title: string; imageUrl: string | null; year: number | null; rating: number | null; episodes?: number | null }
): Promise<'success' | 'duplicate' | 'error'> {
  try {
    // Check if already exists
    const existing = await db.watchlistItem.findUnique({
      where: {
        externalId_type: {
          externalId: String(metadata.id),
          type: item.type,
        }
      }
    });
    
    if (existing) {
      return 'duplicate';
    }
    
    // Create the item
    await db.watchlistItem.create({
      data: {
        externalId: String(metadata.id),
        type: item.type,
        title: metadata.title,
        imageUrl: metadata.imageUrl,
        year: metadata.year,
        rating: metadata.rating,
        episodes: metadata.episodes || null,
        status: item.status,
      }
    });
    
    return 'success';
  } catch (error) {
    console.error(`Error importing "${item.title}":`, error);
    return 'error';
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const destinations = formData.getAll('destinations') as string[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    const result: ImportResult = {
      success: 0,
      duplicates: 0,
      failed: 0,
      errors: [],
      skipped: 0,
    };
    
    // Process each file
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const destination = destinations[fileIndex] as 'PLAN_TO_WATCH' | 'WATCHED' | 'auto';
      const content = await file.text();
      const filename = file.name.toLowerCase();
      
      let parsedItems: ParsedItem[] = [];
      
      // Detect and parse file type
      if (filename.endsWith('.xml') || content.includes('<myanimelist>')) {
        // MAL XML
        const parseResult = parseMALXML(content);
        parsedItems = parseResult.items;
        result.errors.push(...parseResult.errors);
        result.skipped += parseResult.skipped;
      } else if (filename.endsWith('.csv')) {
        // Letterboxd CSV
        // Determine destination based on filename if auto
        let targetStatus: 'PLAN_TO_WATCH' | 'WATCHED' = 'PLAN_TO_WATCH';
        if (destination === 'auto') {
          if (filename.includes('watched')) {
            targetStatus = 'WATCHED';
          } else {
            targetStatus = 'PLAN_TO_WATCH';
          }
        } else {
          targetStatus = destination;
        }
        
        const parseResult = parseLetterboxdCSV(content, targetStatus);
        parsedItems = parseResult.items;
        result.errors.push(...parseResult.errors);
        result.skipped += parseResult.skipped;
      } else {
        result.errors.push(`Unknown file type: ${file.name}`);
        continue;
      }
      
      // Process each parsed item
      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        
        let metadata: { id: number; title: string; imageUrl: string | null; year: number | null; rating: number | null; episodes?: number | null } | null = null;
        
        if (item.type === 'ANIME') {
          // Search Jikan with rate limiting (3 req/sec max)
          metadata = await searchJikanAnime(item.externalId, item.title);
          await delay(400); // ~2.5 requests per second to be safe
        } else {
          // Search TMDB for movies
          metadata = await searchTMDBMovie(item.title, item.year);
          await delay(100); // TMDB is more lenient
        }
        
        if (!metadata) {
          result.failed++;
          result.errors.push(`"${item.title}": No match found`);
          continue;
        }
        
        // Import the item
        const importResult = await importItem(item, metadata);
        
        switch (importResult) {
          case 'success':
            result.success++;
            break;
          case 'duplicate':
            result.duplicates++;
            break;
          case 'error':
            result.failed++;
            result.errors.push(`"${item.title}": Database error`);
            break;
        }
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
