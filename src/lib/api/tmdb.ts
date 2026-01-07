// TMDB API Client for Movies and Shows
export interface TMDBSearchResult {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string; // For movies
  first_air_date?: string; // For TV shows
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type: 'movie' | 'tv';
}

export interface TMDBSearchResponse {
  results: TMDBSearchResult[];
  page: number;
  total_pages: number;
  total_results: number;
}

export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  try {
    const response = await fetch(`/api/watchlist/search/movies?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error('Failed to search movies');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
}

export async function searchTVShows(query: string): Promise<TMDBSearchResult[]> {
  try {
    const response = await fetch(`/api/watchlist/search/tv?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error('Failed to search TV shows');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching TV shows:', error);
    throw error;
  }
}

export function getTMDBImageUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}


