export type SportType = 'NBA' | 'NFL';

export interface GameScore {
  id: string;
  sport: SportType;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  status: 'scheduled' | 'live' | 'final';
  quarter?: string;
  timeRemaining?: string;
  startTime: Date;
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

