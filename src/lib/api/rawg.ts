// RAWG API Client for Games
import { trackApiUsage } from '@/lib/api-usage';

const RAWG_API_KEY = process.env.RAWG_API_KEY || '6699bbf61186434ab123c9cfbea8f294';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface RAWGGame {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  rating_top: number;
  ratings_count: number;
  metacritic: number | null;
  slug: string;
}

export interface RAWGSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RAWGGame[];
}

export interface GameSearchResult {
  id: string;
  type: 'game';
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  externalId: number;
}

/**
 * Search games using RAWG API
 */
export async function searchGames(query: string): Promise<GameSearchResult[]> {
  try {
    const url = `${RAWG_BASE_URL}/games?search=${encodeURIComponent(query)}&page_size=20&key=${RAWG_API_KEY}`;
    const response = await fetch(url);

    const isSuccess = response.ok && response.status !== 429;
    await trackApiUsage('rawg', {
      endpoint: '/games (search)',
      success: isSuccess,
      statusCode: response.status,
    });

    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
    }

    const data: RAWGSearchResponse = await response.json();
    
    return data.results
      .filter(game => game.background_image && game.rating && game.rating > 0)
      .map(game => ({
        id: `game-${game.id}`,
        type: 'game' as const,
        title: game.name,
        image: game.background_image,
        year: game.released ? new Date(game.released).getFullYear() : null,
        rating: game.rating,
        externalId: game.id,
      }));
  } catch (error) {
    console.error('Error searching games:', error);
    throw error;
  }
}

/**
 * Get top-rated games from RAWG API
 */
export async function getTopGames(limit: number = 50): Promise<GameSearchResult[]> {
  try {
    const url = `${RAWG_BASE_URL}/games?ordering=-rating&page_size=${limit}&key=${RAWG_API_KEY}`;
    const response = await fetch(url);

    const isSuccess = response.ok && response.status !== 429;
    await trackApiUsage('rawg', {
      endpoint: '/games (top)',
      success: isSuccess,
      statusCode: response.status,
    });

    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
    }

    const data: RAWGSearchResponse = await response.json();
    
    return data.results
      .filter(game => game.background_image && game.rating && game.rating > 0)
      .map(game => ({
        id: `game-${game.id}`,
        type: 'game' as const,
        title: game.name,
        image: game.background_image,
        year: game.released ? new Date(game.released).getFullYear() : null,
        rating: game.rating,
        externalId: game.id,
      }));
  } catch (error) {
    console.error('Error fetching top games:', error);
    throw error;
  }
}

/**
 * Format RAWG image URL
 * RAWG images are already full URLs, so we can return them as-is
 */
export function getGameImageUrl(path: string | null): string | null {
  if (!path) return null;
  // RAWG images are already full URLs
  return path;
}
