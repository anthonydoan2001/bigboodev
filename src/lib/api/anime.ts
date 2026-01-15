// Jikan API Client for Anime
export interface AnimeSearchResult {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string | null;
  episodes: number | null;
  status: string;
  score: number | null;
  year: number | null;
  type: string;
}

export interface AnimeSearchResponse {
  data: AnimeSearchResult[];
  pagination: {
    has_next_page: boolean;
    current_page: number;
  };
}

import { trackApiUsage } from '@/lib/api-usage';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

export async function searchAnime(query: string): Promise<AnimeSearchResult[]> {
  try {
    const response = await fetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=10`);

    const isSuccess = response.ok && response.status !== 429;
    await trackApiUsage('jikan', {
      endpoint: '/anime',
      success: isSuccess,
      statusCode: response.status,
    });

    if (!response.ok) {
      throw new Error('Failed to search anime');
    }

    const data: AnimeSearchResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error searching anime:', error);
    throw error;
  }
}




