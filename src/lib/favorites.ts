// Favorites management using localStorage

const FAVORITES_KEY = 'sports-favorites';

// Houston teams that should always be favorited
const HOUSTON_TEAMS = ['Houston Texans', 'Houston Rockets'];

export function isHoustonGame(homeTeam: string, awayTeam: string): boolean {
  return HOUSTON_TEAMS.includes(homeTeam) || HOUSTON_TEAMS.includes(awayTeam);
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addFavorite(gameId: string): void {
  const favorites = getFavorites();
  if (!favorites.includes(gameId)) {
    favorites.push(gameId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(gameId: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter(id => id !== gameId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export function toggleFavorite(gameId: string): boolean {
  const favorites = getFavorites();
  const isFavorite = favorites.includes(gameId);

  if (isFavorite) {
    removeFavorite(gameId);
    return false;
  } else {
    addFavorite(gameId);
    return true;
  }
}

export function isFavoriteGame(gameId: string): boolean {
  return getFavorites().includes(gameId);
}

// Auto-favorite Houston games
export function autoFavoriteHoustonGames(games: Array<{ id: string; homeTeam: string; awayTeam: string }>) {
  games.forEach(game => {
    if (isHoustonGame(game.homeTeam, game.awayTeam)) {
      addFavorite(game.id);
    }
  });
}

