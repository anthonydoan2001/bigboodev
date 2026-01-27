import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

export interface UniversalSearchResult {
  id: string;
  type: 'anime' | 'movie' | 'show';
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  episodes?: number | null;
  externalId: number;
}

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average: number;
}

interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string;
  vote_average: number;
}

interface JikanGenre {
  name: string;
}

interface JikanAnime {
  mal_id: number;
  title: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  score: number | null;
  rating?: string;
  genres?: JikanGenre[];
  explicit_genres?: JikanGenre[];
  episodes?: number;
  year?: number;
}

// Helper function to fetch with retry for rate limits
async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const response = await fetch(url);
    
    // If rate limited (429), wait and retry
    if (response.status === 429 && i < retries) {
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response;
  }
  
  // Return last response if all retries exhausted
  return fetch(url);
}

export const GET = withAuth(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const results: UniversalSearchResult[] = [];

    // Fetch TMDB results first (no rate limit issues)
    const [moviesResponse, tvResponse] = await Promise.all([
      TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`) : Promise.resolve(null),
      TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`) : Promise.resolve(null),
    ]);

    // Parse movie results first
    if (moviesResponse && moviesResponse.ok) {
      const moviesData = await moviesResponse.json();
      moviesData.results.slice(0, 20).forEach((movie: TMDBMovie) => {
        const rating = movie.vote_average;
        // Only include movies with a valid rating (not null, undefined, or 0)
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

    // Parse TV results
    if (tvResponse && tvResponse.ok) {
      const tvData = await tvResponse.json();
      tvData.results.slice(0, 20).forEach((show: TMDBShow) => {
        const rating = show.vote_average;
        // Only include shows with a valid rating (not null, undefined, or 0)
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

    // Fetch Jikan (anime) separately with retry logic for rate limits
    try {
      const animeResponse = await fetchWithRetry(
        `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=20`,
        2,  // retries
        1000 // 1 second delay
      );

      if (animeResponse.ok) {
        const animeData = await animeResponse.json();
        if (animeData.data) {
          animeData.data.slice(0, 20).forEach((anime: JikanAnime) => {
            const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            const rating = anime.score;
            
            // Filter out hentai content
            const isHentai = 
              anime.rating === 'Rx' || 
              anime.rating === 'R+ - Mild Nudity' ||
              (anime.genres && anime.genres.some((g: JikanGenre) => 
                g.name?.toLowerCase().includes('hentai') || 
                g.name?.toLowerCase() === 'hentai'
              )) ||
              (anime.explicit_genres && anime.explicit_genres.some((g: JikanGenre) => 
                g.name?.toLowerCase().includes('hentai') || 
                g.name?.toLowerCase() === 'hentai'
              ));
            
            // Only include anime with a valid rating (not null, undefined, or 0) and exclude hentai
            if (imageUrl && rating && rating > 0 && !isHentai) {
              results.push({
                id: `anime-${anime.mal_id}`,
                type: 'anime',
                title: anime.title,
                image: imageUrl,
                year: anime.year ?? null,
                rating: rating,
                episodes: anime.episodes,
                externalId: anime.mal_id,
              });
            }
          });
        }
      }
    } catch {
      // Continue without anime results
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
});

