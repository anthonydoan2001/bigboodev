export type WatchlistType = 'anime' | 'movie' | 'show' | 'kdrama' | 'manga' | 'book';

export type WatchlistStatus = 'to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';

export interface WatchlistItem {
  id: string;
  type: WatchlistType;
  title: string;
  status: WatchlistStatus;
  externalId?: string;
  coverImage?: string;
  description?: string;
  rating?: number; // 1-10
  progress?: string;
  notes?: string;
  addedAt: Date;
  updatedAt: Date;
}

