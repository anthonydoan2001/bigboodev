import { LeagueStatsResponse, AramChallengeResponse } from '@/types/league-of-legends';

/**
 * Fetches League of Legends stats from the API route
 */
export async function fetchLeagueStats(): Promise<LeagueStatsResponse> {
  const response = await fetch('/api/lol', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch League stats' }));
    throw new Error(error.error || 'Failed to fetch League stats');
  }

  return response.json();
}

/**
 * Fetches ARAM Authority challenge data
 */
export async function fetchAramChallenge(): Promise<AramChallengeResponse> {
  const response = await fetch('/api/lol/aram', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch ARAM challenge' }));
    throw new Error(error.error || 'Failed to fetch ARAM challenge');
  }

  return response.json();
}
