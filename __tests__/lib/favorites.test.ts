import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isHoustonGame,
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavoriteGame,
  autoFavoriteHoustonGames,
} from '@/lib/favorites';

// In-memory localStorage stub
function stubLocalStorage() {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  });
  // Also need window to be defined for the typeof check
  vi.stubGlobal('window', {});
  return store;
}

describe('favorites', () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  describe('isHoustonGame', () => {
    it('returns true when Houston Texans is home', () => {
      expect(isHoustonGame('Houston Texans', 'Dallas Cowboys')).toBe(true);
    });

    it('returns true when Houston Rockets is away', () => {
      expect(isHoustonGame('LA Lakers', 'Houston Rockets')).toBe(true);
    });

    it('returns false for non-Houston matchup', () => {
      expect(isHoustonGame('Dallas Cowboys', 'NY Giants')).toBe(false);
    });
  });

  describe('getFavorites / addFavorite / removeFavorite', () => {
    it('returns empty array when no favorites stored', () => {
      expect(getFavorites()).toEqual([]);
    });

    it('adds and retrieves a favorite', () => {
      addFavorite('game-1');
      expect(getFavorites()).toContain('game-1');
    });

    it('does not add duplicates', () => {
      addFavorite('game-1');
      addFavorite('game-1');
      expect(getFavorites().filter((id) => id === 'game-1')).toHaveLength(1);
    });

    it('removes a favorite', () => {
      addFavorite('game-1');
      removeFavorite('game-1');
      expect(getFavorites()).not.toContain('game-1');
    });
  });

  describe('toggleFavorite', () => {
    it('adds and returns true when not a favorite', () => {
      const result = toggleFavorite('game-2');
      expect(result).toBe(true);
      expect(isFavoriteGame('game-2')).toBe(true);
    });

    it('removes and returns false when already a favorite', () => {
      addFavorite('game-3');
      const result = toggleFavorite('game-3');
      expect(result).toBe(false);
      expect(isFavoriteGame('game-3')).toBe(false);
    });
  });

  describe('autoFavoriteHoustonGames', () => {
    it('auto-favorites Houston team games', () => {
      autoFavoriteHoustonGames([
        { id: 'g1', homeTeam: 'Houston Texans', awayTeam: 'Dallas Cowboys' },
        { id: 'g2', homeTeam: 'LA Lakers', awayTeam: 'Boston Celtics' },
        { id: 'g3', homeTeam: 'NY Knicks', awayTeam: 'Houston Rockets' },
      ]);
      expect(isFavoriteGame('g1')).toBe(true);
      expect(isFavoriteGame('g2')).toBe(false);
      expect(isFavoriteGame('g3')).toBe(true);
    });
  });
});
