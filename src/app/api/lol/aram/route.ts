import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { RiotAccountResponse, AramChallengeResponse } from '@/types/league-of-legends';
import { getDashboardSettings } from '@/lib/settings';

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION = 'na1';
const AMERICAS_REGION = 'americas';

// ARAM Authority challenge ID (capstone challenge for ARAM)
// Earns progress from ARAM Warrior (101100), ARAM Finesse (101200), and ARAM Champion (101300) groups
const ARAM_AUTHORITY_CHALLENGE_ID = 101000;

// ARAM God requires 1850 points
const ARAM_GOD_THRESHOLD = 1850;

// Tier thresholds for ARAM Authority
const ARAM_TIERS = [
  { tier: 'NONE', min: 0 },
  { tier: 'IRON', min: 0 },
  { tier: 'BRONZE', min: 50 },
  { tier: 'SILVER', min: 125 },
  { tier: 'GOLD', min: 275 },
  { tier: 'PLATINUM', min: 550 },
  { tier: 'DIAMOND', min: 950 },
  { tier: 'MASTER', min: 1350 },
  { tier: 'GRANDMASTER', min: 1750 },
  { tier: 'CHALLENGER', min: 1850 },
] as const;

// In-memory cache
let cachedData: AramChallengeResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface RiotChallengeData {
  challenges: Array<{
    challengeId: number;
    percentile: number;
    level: string;
    value: number;
    achievedTime?: number;
  }>;
  totalPoints: {
    level: string;
    current: number;
    max: number;
    percentile: number;
  };
}

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
    throw new Error('API_KEY_INVALID: Your Riot API key is invalid or expired.');
  }

  if (response.status === 404) {
    throw new Error('NOT_FOUND: Data not found.');
  }

  if (!response.ok) {
    throw new Error(`Riot API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getTierFromPoints(points: number): string {
  for (let i = ARAM_TIERS.length - 1; i >= 0; i--) {
    if (points >= ARAM_TIERS[i].min) {
      return ARAM_TIERS[i].tier;
    }
  }
  return 'NONE';
}

async function getAramChallengeData(): Promise<AramChallengeResponse> {
  // Check cache
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  const settings = await getDashboardSettings();
  const SUMMONER_NAME = settings.lol.summonerName;
  const SUMMONER_TAG = settings.lol.tag;

  // Step 1: Get PUUID from Riot ID (Account-V1)
  const accountUrl = `https://${AMERICAS_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(SUMMONER_NAME)}/${encodeURIComponent(SUMMONER_TAG)}`;
  const account = await fetchRiotApi<RiotAccountResponse>(accountUrl);

  // Step 2: Get challenge data
  const challengesUrl = `https://${REGION}.api.riotgames.com/lol/challenges/v1/player-data/${account.puuid}`;
  const challengeData = await fetchRiotApi<RiotChallengeData>(challengesUrl);

  // Find ARAM Authority challenge
  const aramChallenge = challengeData.challenges.find(
    (c) => c.challengeId === ARAM_AUTHORITY_CHALLENGE_ID
  );

  const currentPoints = aramChallenge?.value ?? 0;
  const tier = getTierFromPoints(currentPoints);
  const percentile = aramChallenge?.percentile ?? 0;

  const result: AramChallengeResponse = {
    currentPoints,
    targetPoints: ARAM_GOD_THRESHOLD,
    tier,
    percentile,
    percentage: Math.min(100, Math.round((currentPoints / ARAM_GOD_THRESHOLD) * 100)),
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
      { error: 'RIOT_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  try {
    const data = await getAramChallengeData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ARAM challenge data:', error);

    // Return cached data if available on error
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch ARAM challenge data',
      },
      { status: 500 }
    );
  }
});
