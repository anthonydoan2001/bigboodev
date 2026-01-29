export interface RankedEntry {
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR';
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface LeagueStatsResponse {
  summonerName: string;
  summonerLevel: number;
  profileIconId: number;
  soloQueue: RankedEntry | null;
  flexQueue: RankedEntry | null;
  lastUpdated: string;
}

// Riot API response types
export interface RiotAccountResponse {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummonerResponse {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}
