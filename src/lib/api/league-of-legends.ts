import { LeagueStatsResponse } from '@/types/league-of-legends';
import { getSession } from '@/lib/auth';

/**
 * Fetches League of Legends stats from the API route
 */
export async function fetchLeagueStats(): Promise<LeagueStatsResponse> {
  const sessionToken = getSession();

  const headers: HeadersInit = {};
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }

  const response = await fetch('/api/lol', {
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch League stats' }));
    throw new Error(error.error || 'Failed to fetch League stats');
  }

  return response.json();
}
