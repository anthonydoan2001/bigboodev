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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // Search all three sources in parallel
    const [animeResponse, moviesResponse, tvResponse] = await Promise.all([
      fetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=5`),
      TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`) : Promise.resolve(null),
      TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`) : Promise.resolve(null),
    ]);

    const results: UniversalSearchResult[] = [];

    // Parse anime results
    if (animeResponse.ok) {
      const animeData = await animeResponse.json();
      animeData.data.slice(0, 5).forEach((anime: any) => {
        results.push({
          id: `anime-${anime.mal_id}`,
          type: 'anime',
          title: anime.title,
          image: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
          year: anime.year,
          rating: anime.score,
          episodes: anime.episodes,
          externalId: anime.mal_id,
        });
      });
    }

    // Parse movie results
    if (moviesResponse && moviesResponse.ok) {
      const moviesData = await moviesResponse.json();
      moviesData.results.slice(0, 5).forEach((movie: any) => {
        results.push({
          id: `movie-${movie.id}`,
          type: 'movie',
          title: movie.title,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : null,
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
          rating: movie.vote_average || null,
          externalId: movie.id,
        });
      });
    }

    // Parse TV results
    if (tvResponse && tvResponse.ok) {
      const tvData = await tvResponse.json();
      tvData.results.slice(0, 5).forEach((show: any) => {
        results.push({
          id: `show-${show.id}`,
          type: 'show',
          title: show.name,
          image: show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : null,
          year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
          rating: show.vote_average || null,
          externalId: show.id,
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Universal search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

