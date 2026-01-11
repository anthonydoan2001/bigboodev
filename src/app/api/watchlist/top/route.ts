import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

export interface TopItem {
  id: string;
  type: 'anime' | 'movie' | 'show';
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  episodes?: number | null;
  externalId: number;
}

export async function GET() {
  try {
    // Fetch top items from all sources in parallel
    // Fetch more items to account for filtering out watched/watching/watchlist items
    // Jikan API has a max limit of 25 per request, so we'll fetch multiple pages
    const [animeResponse1, animeResponse2, moviesResponse, tvResponse] = await Promise.all([
      fetch(`${JIKAN_BASE_URL}/top/anime?limit=25&page=1`),
      fetch(`${JIKAN_BASE_URL}/top/anime?limit=25&page=2`),
      TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1`) : Promise.resolve(null),
      TMDB_API_KEY ? fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=1`) : Promise.resolve(null),
    ]);

    const results: TopItem[] = [];

    // Parse anime results from multiple pages
    const parseAnimeResponse = async (response: Response): Promise<TopItem[]> => {
      if (response.ok) {
        try {
          const animeData = await response.json();
          // Check if data exists and is an array
          const animeList = animeData?.data || animeData || [];
          if (Array.isArray(animeList)) {
            const validItems: TopItem[] = [];
            animeList.forEach((anime: any) => {
              const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
              const rating = anime.score;
              // Only add if image exists and has a valid rating
              if (imageUrl && rating && rating > 0) {
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
      }
      return [];
    };

    const [animePage1, animePage2] = await Promise.all([
      parseAnimeResponse(animeResponse1),
      parseAnimeResponse(animeResponse2),
    ]);

    results.push(...animePage1, ...animePage2);

    // Parse movie results - fetch multiple pages to get more items
    if (moviesResponse && moviesResponse.ok) {
      const moviesData = await moviesResponse.json();
      // Fetch additional pages for more movies
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
        // Only add if poster_path exists and has a valid rating
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

    // Parse TV results - fetch multiple pages to get more items
    if (tvResponse && tvResponse.ok) {
      const tvData = await tvResponse.json();
      // Fetch additional pages for more TV shows
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
        // Only add if poster_path exists and has a valid rating
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

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Top items fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch top items' }, { status: 500 });
  }
}

