export type GameStatus = 'PLAN_TO_PLAY' | 'PLAYING' | 'PLAYED';

export interface Game {
  id: string;
  title: string;
  status: GameStatus;
  externalId: string;
  imageUrl: string | null;
  rating: number | null;
  released: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface TopGame {
  id: string;
  title: string;
  image: string | null;
  year: number | null;
  rating: number | null;
  externalId: number;
}
