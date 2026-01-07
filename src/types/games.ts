export type GameStatus = 'to_play' | 'playing' | 'completed' | 'dropped';

export type Platform = 'PC' | 'PS5' | 'Xbox' | 'Switch' | 'Mobile';

export interface GameListItem {
  id: string;
  title: string;
  status: GameStatus;
  platform: Platform;
  externalId?: string;
  coverImage?: string;
  description?: string;
  rating?: number; // 1-10
  hoursPlayed?: number;
  completionPercent?: number;
  notes?: string;
  addedAt: Date;
  updatedAt: Date;
}

