// Game status enum
export type GameStatus = 'PLAYING' | 'PLAYED' | 'PLAYLIST';

// Database Game type (matches Prisma model)
export interface Game {
  id: string;
  gameTitle: string;
  rawgRating: number | null;
  coverArtUrl: string | null;
  status: GameStatus;
  rawgGameId: number;
  releaseDate: string | null;
  genres: string | null;
  platforms: string | null;
  metacritic: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// RAWG API Response types
export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  released: string | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[] | null;
}

export interface RawgSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}

// Search result for UI
export interface GameSearchResult {
  id: number;
  name: string;
  coverImage: string | null;
  rating: number;
  metacritic: number | null;
  releaseDate: string | null;
  genres: string[];
  platforms: string[];
}

// Transform RAWG response to our format
export function transformRawgGame(game: RawgGame): GameSearchResult {
  return {
    id: game.id,
    name: game.name,
    coverImage: game.background_image,
    rating: game.rating,
    metacritic: game.metacritic,
    releaseDate: game.released,
    genres: game.genres?.map(g => g.name) || [],
    platforms: game.platforms?.map(p => p.platform.name) || [],
  };
}
