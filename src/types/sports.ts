import {
  SportType as PrismaSportType,
  GameScoreStatus as PrismaGameScoreStatus,
  GameScore as PrismaGameScore,
  TopPerformer as PrismaTopPerformer,
} from '@prisma/client';

// Re-export Prisma enums and types
export { PrismaSportType, PrismaGameScoreStatus };
export type { PrismaGameScore, PrismaTopPerformer };

// Type aliases for backward compatibility (string literal types)
export type SportType = `${PrismaSportType}`;
export type GameScoreStatus = `${PrismaGameScoreStatus}`;

export type PlayoffRound = 'Wild Card' | 'Divisional' | 'Conference Championship' | 'Super Bowl';

// API/Component interface (simpler than database model)
export interface GameScore {
  id: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeTeamAbbr?: string;
  awayTeamAbbr?: string;
  status: GameScoreStatus;
  quarter?: string;
  timeRemaining?: string;
  startTime: Date;
  playoffRound?: PlayoffRound;
  odds?: {
    spread?: string;
    overUnder?: string;
    favorite?: 'home' | 'away';
    details?: string;
  };
  topScorer?: {
    name: string;
    points: number;
    team: 'home' | 'away';
    image?: string;
  };
}

export interface TopPerformer {
  name: string;
  team: string;
  image?: string;
  stats: {
    points?: number;
    rebounds?: number;
    assists?: number;
    blocks?: number;
    steals?: number;
    passingYards?: number;
    touchdowns?: number;
    rushingYards?: number;
    receivingYards?: number;
    [key: string]: number | undefined;
  };
}

export interface TeamStanding {
  rank: number;
  team: string;
  teamLogo?: string;
  wins: number;
  losses: number;
  winPercentage: number;
  streak: string; // e.g., "W3" or "L2"
  last10Wins?: number;
  last10Losses?: number;
  conference: 'Eastern' | 'Western';
}

