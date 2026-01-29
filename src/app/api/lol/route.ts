import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import {
  RiotAccountResponse,
  RiotSummonerResponse,
  RiotLeagueEntry,
  LeagueStatsResponse,
  RankedEntry,
} from '@/types/league-of-legends';

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const SUMMONER_NAME = 'ExoticLime';
const SUMMONER_TAG = 'NA1';
const REGION = 'na1';
const AMERICAS_REGION = 'americas';

// In-memory cache
let cachedData: LeagueStatsResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchRiotApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY!,
    },
    cache: 'no-store',
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  if (response.status === 403) {
    throw new Error('API_KEY_INVALID: Your Riot API key is invalid or expired. Development keys expire every 24 hours. Get a new key at https://developer.riotgames.com/');
  }

  if (response.status === 404) {
    throw new Error('SUMMONER_NOT_FOUND: Summoner not found. Check the name and region.');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'No response body');
    throw new Error(`Riot API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

async function getLeagueStats(): Promise<LeagueStatsResponse> {
  // Check cache
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  // Step 1: Get PUUID from Riot ID (Account-V1)
  const accountUrl = `https://${AMERICAS_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(SUMMONER_NAME)}/${encodeURIComponent(SUMMONER_TAG)}`;
  const account = await fetchRiotApi<RiotAccountResponse>(accountUrl);

  // Step 2: Get summoner data (Summoner-V4)
  const summonerUrl = `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`;
  const summoner = await fetchRiotApi<RiotSummonerResponse>(summonerUrl);

  // Step 3: Get ranked entries (League-V4) - use by-puuid endpoint
  const leagueUrl = `https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`;
  const leagueEntries = await fetchRiotApi<RiotLeagueEntry[]>(leagueUrl);

  // Parse ranked entries
  let soloQueue: RankedEntry | null = null;
  let flexQueue: RankedEntry | null = null;

  for (const entry of leagueEntries) {
    if (entry.queueType === 'RANKED_SOLO_5x5') {
      soloQueue = {
        queueType: 'RANKED_SOLO_5x5',
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      };
    } else if (entry.queueType === 'RANKED_FLEX_SR') {
      flexQueue = {
        queueType: 'RANKED_FLEX_SR',
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      };
    }
  }

  const result: LeagueStatsResponse = {
    summonerName: `${account.gameName}#${account.tagLine}`,
    summonerLevel: summoner.summonerLevel,
    profileIconId: summoner.profileIconId,
    soloQueue,
    flexQueue,
    lastUpdated: new Date().toISOString(),
  };

  // Update cache
  cachedData = result;
  cacheTimestamp = now;

  return result;
}

export const GET = withAuth(async () => {
  if (!RIOT_API_KEY) {
    return NextResponse.json(
      { error: 'RIOT_API_KEY is not configured. Add it to your .env file.' },
      { status: 500 }
    );
  }

  // Basic validation - Riot API keys are typically 42 characters (RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  if (!RIOT_API_KEY.startsWith('RGAPI-') || RIOT_API_KEY.length < 40) {
    return NextResponse.json(
      { error: 'RIOT_API_KEY appears malformed. It should start with "RGAPI-" and be ~42 characters.' },
      { status: 500 }
    );
  }

  try {
    const stats = await getLeagueStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching League stats:', error);

    // Return cached data if available on error
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch League stats',
      },
      { status: 500 }
    );
  }
});
