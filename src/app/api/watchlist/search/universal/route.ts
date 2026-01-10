import { NextResponse } from 'next/server';

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

// Helper function to fetch with retry for rate limits
async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const response = await fetch(url);
    
    // If rate limited (429), wait and retry
    if (response.status === 429 && i < retries) {
      console.log(`Rate limited, waiting ${delay}ms before retry ${i + 1}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response;
  }
  
  // Return last response if all retries exhausted
  return fetch(url);
}

export async function GET(request: Request) {
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
      moviesData.results.slice(0, 20).forEach((movie: any) => {
        if (movie.poster_path) {
          results.push({
            id: `movie-${movie.id}`,
            type: 'movie',
            title: movie.title,
            image: `https://image.tmdb.org/t/p/w342${movie.poster_path}`,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            rating: movie.vote_average || null,
            externalId: movie.id,
          });
        }
      });
    }

    // Parse TV results
    if (tvResponse && tvResponse.ok) {
      const tvData = await tvResponse.json();
      tvData.results.slice(0, 20).forEach((show: any) => {
        if (show.poster_path) {
          results.push({
            id: `show-${show.id}`,
            type: 'show',
            title: show.name,
            image: `https://image.tmdb.org/t/p/w342${show.poster_path}`,
            year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
            rating: show.vote_average || null,
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
          animeData.data.slice(0, 20).forEach((anime: any) => {
            const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
            if (imageUrl) {
              results.push({
                id: `anime-${anime.mal_id}`,
                type: 'anime',
                title: anime.title,
                image: imageUrl,
                year: anime.year,
                rating: anime.score,
                episodes: anime.episodes,
                externalId: anime.mal_id,
              });
            }
          });
        }
      } else if (animeResponse.status === 429) {
        console.warn('Jikan API rate limited, skipping anime results');
      }
    } catch (animeError) {
      console.warn('Failed to fetch anime results:', animeError);
      // Continue without anime results
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Universal search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

