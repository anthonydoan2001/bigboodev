'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GameScore } from '@/types/sports';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { getAuthHeaders } from '@/lib/api-client';

// Helper to format date string for API
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fetch scores for a specific date
async function fetchScoresForDate(date: Date): Promise<GameScore[]> {
  const dateStr = formatDateString(date);
  const response = await fetch(`/api/sports/scores?sport=NBA&date=${dateStr}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch scores');
  }

  const data = await response.json();
  return data.scores.map((game: Omit<GameScore, 'startTime'> & { startTime: string }) => ({
    ...game,
    startTime: new Date(game.startTime),
  })) as GameScore[];
}

// Check if a game is a Houston Rockets game
function isRocketsGame(game: GameScore): boolean {
  const homeTeam = game.homeTeam.toLowerCase();
  const awayTeam = game.awayTeam.toLowerCase();
  return homeTeam.includes('rockets') || awayTeam.includes('rockets');
}

// Fetch Rockets games including upcoming ones
async function fetchRocketsGames(): Promise<{
  liveGame: GameScore | null;
  recentFinishedGame: GameScore | null;
  upcomingGame: GameScore | null;
}> {
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  // Fetch today and the next 7 days to find games
  const datesToCheck: Date[] = [];
  for (let i = 0; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    datesToCheck.push(date);
  }

  // Also check yesterday for recently finished games
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  datesToCheck.unshift(yesterday);

  let liveGame: GameScore | null = null;
  let recentFinishedGame: GameScore | null = null;
  let upcomingGame: GameScore | null = null;

  // Fetch all dates in parallel
  const results = await Promise.all(
    datesToCheck.map(date =>
      fetchScoresForDate(date).catch(() => [] as GameScore[])
    )
  );

  // Flatten and filter for Rockets games
  const allRocketsGames = results.flat().filter(isRocketsGame);

  // Find live game
  liveGame = allRocketsGames.find(game => game.status === 'live') || null;

  // Find recent finished game (within 12 hours)
  const finishedGames = allRocketsGames
    .filter(game => game.status === 'final')
    .filter(game => game.startTime >= twelveHoursAgo)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  recentFinishedGame = finishedGames[0] || null;

  // Find next upcoming game
  const scheduledGames = allRocketsGames
    .filter(game => game.status === 'scheduled')
    .filter(game => game.startTime >= now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  upcomingGame = scheduledGames[0] || null;

  return { liveGame, recentFinishedGame, upcomingGame };
}

export function RocketsGameWidget() {
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      // Use setTimeout to avoid synchronous setState in effect body
      const timer = setTimeout(() => setIsHydrated(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['rockets-game'],
    queryFn: fetchRocketsGames,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const result = query.state.data;
      // Refresh every 30 seconds if there's a live game
      if (result?.liveGame) {
        return 30000;
      }
      // Otherwise refresh every 5 minutes
      return 300000;
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-none overflow-hidden py-0 gap-0">
        <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] flex flex-col justify-center">
          <Skeleton className="h-3 w-12 mb-2" />
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-[var(--dash-gap-sm)]">
                <Skeleton className="w-7 h-7 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)]" rounded="full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-[var(--dash-gap-sm)]">
                <Skeleton className="w-7 h-7 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)]" rounded="full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-none flex items-center justify-center py-0 gap-0">
        <p className="text-sm text-muted-foreground">Failed to load Rockets game</p>
      </Card>
    );
  }

  // Determine which game to show
  // Priority: 1. Live game, 2. Recent finished game (within 12 hours), 3. Upcoming game
  const { liveGame, recentFinishedGame, upcomingGame } = data;
  const gameToShow = liveGame || recentFinishedGame || upcomingGame;

  if (!gameToShow) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-none flex items-center justify-center py-0 gap-0">
        <CardContent className="!px-3 !py-3 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] text-center">
          <div className="flex items-center justify-center gap-2 md:gap-[var(--dash-gap-sm)] mb-1.5">
            <Image
              src="https://a.espncdn.com/i/teamlogos/nba/500/hou.png"
              alt="Houston Rockets"
              width={24}
              height={24}
              className="object-contain"
              unoptimized
            />
            <span className="text-sm md:text-[length:var(--dash-text-base)] font-medium">Rockets</span>
          </div>
          <p className="text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground">No upcoming games found</p>
        </CardContent>
      </Card>
    );
  }

  const isHomeWinning = gameToShow.homeScore > gameToShow.awayScore;
  const isAwayWinning = gameToShow.awayScore > gameToShow.homeScore;
  const isFinal = gameToShow.status === 'final';
  const isLive = gameToShow.status === 'live';
  const isScheduled = gameToShow.status === 'scheduled';

  // Determine if Rockets are home or away
  const rocketsAreHome = gameToShow.homeTeam.toLowerCase().includes('rockets');
  const rocketsWon = isFinal && (
    (rocketsAreHome && isHomeWinning) || (!rocketsAreHome && isAwayWinning)
  );

  // Get status display
  const getStatusDisplay = () => {
    if (isLive) {
      let displayText = '';
      if (gameToShow.quarter && gameToShow.timeRemaining) {
        const quarter = gameToShow.quarter;
        const timeRemaining = gameToShow.timeRemaining.trim();

        if (timeRemaining === '0.0' || timeRemaining === '0:00') {
          if (quarter === 'Q2') {
            displayText = 'Halftime';
          } else {
            displayText = `End of ${quarter}`;
          }
        } else {
          displayText = `${quarter} ${timeRemaining}`;
        }
      } else if (gameToShow.quarter) {
        displayText = gameToShow.quarter;
      } else {
        displayText = 'LIVE';
      }

      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-live/10 text-live text-xs md:text-[length:var(--dash-text-sm)] font-semibold tabular-nums">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live/75 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-live"></span>
          </span>
          {displayText}
        </div>
      );
    }

    if (isFinal) {
      return (
        <span className={`text-xs md:text-[length:var(--dash-text-sm)] font-semibold ${rocketsWon ? 'text-success' : 'text-muted-foreground'}`}>
          {rocketsWon ? 'WIN' : 'FINAL'}
        </span>
      );
    }

    // Scheduled
    return (
      <div className="flex items-center gap-1.5 text-xs md:text-[length:var(--dash-text-sm)] text-muted-foreground">
        <Clock className="w-3 h-3 md:w-[var(--dash-icon-xs)] md:h-[var(--dash-icon-xs)]" />
        <span suppressHydrationWarning>
          {isHydrated ? (
            gameToShow.startTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })
          ) : (
            '\u00A0'
          )}
        </span>
      </div>
    );
  };

  // For scheduled games, show a different layout
  if (isScheduled) {
    return (
      <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-none overflow-hidden py-0 gap-0">
        <CardContent className="!px-3 !py-3 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] h-full flex flex-col justify-center items-center text-center">
          {/* Team Matchup */}
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-2 md:mb-3">
            {/* Away Team */}
            <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20">
              <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-black text-foreground/[0.07] select-none tracking-wider">
                {gameToShow.awayTeamAbbr || gameToShow.awayTeam.slice(0, 3).toUpperCase()}
              </span>
              <div className="relative w-11 h-11 md:w-14 md:h-14 z-10">
                {gameToShow.awayTeamLogo ? (
                  <Image
                    src={gameToShow.awayTeamLogo}
                    alt={`${gameToShow.awayTeam} logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted/50" />
                )}
              </div>
            </div>

            {/* VS */}
            <div className="px-2 py-1 rounded-md bg-muted/20">
              <span className="text-xs md:text-[length:var(--dash-text-sm)] font-semibold text-muted-foreground">@</span>
            </div>

            {/* Home Team */}
            <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20">
              <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-black text-foreground/[0.07] select-none tracking-wider">
                {gameToShow.homeTeamAbbr || gameToShow.homeTeam.slice(0, 3).toUpperCase()}
              </span>
              <div className="relative w-11 h-11 md:w-14 md:h-14 z-10">
                {gameToShow.homeTeamLogo ? (
                  <Image
                    src={gameToShow.homeTeamLogo}
                    alt={`${gameToShow.homeTeam} logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted/50" />
                )}
              </div>
            </div>
          </div>

          {/* Game Time & Date */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 md:w-[var(--dash-icon-xs)] md:h-[var(--dash-icon-xs)]" />
            <span className="text-xs md:text-[length:var(--dash-text-sm)]" suppressHydrationWarning>
              {isHydrated ? (
                <>
                  {gameToShow.startTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {gameToShow.startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </>
              ) : (
                '\u00A0'
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For live and finished games, show scores
  return (
    <Card className="w-full bg-background/40 backdrop-blur-md border-white/10 shadow-none overflow-hidden py-0 gap-0">
      <CardContent className="!px-3 !py-2 md:!px-[var(--dash-px)] md:!py-[var(--dash-py)] h-full flex flex-col">
        {/* Header with status */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <span className="text-xs md:text-[length:var(--dash-text-sm)] font-medium text-muted-foreground tracking-wide uppercase">
            {isFinal ? 'FINAL' : 'LIVE'}
          </span>
          {getStatusDisplay()}
        </div>

        {/* Teams & Scores */}
        <div className="flex-1 flex flex-col justify-center space-y-2 md:space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-2.5 flex-1 min-w-0">
              <div className="relative w-7 h-7 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)] flex-shrink-0">
                {gameToShow.awayTeamLogo ? (
                  <Image
                    src={gameToShow.awayTeamLogo}
                    alt={`${gameToShow.awayTeam} logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted/50" />
                )}
              </div>
              <span className={`text-sm md:text-[length:var(--dash-text-base)] truncate ${isFinal && isAwayWinning ? 'font-bold' : 'font-medium'}`}>
                {gameToShow.awayTeam}
              </span>
            </div>
            <span className={`text-base md:text-[length:var(--dash-text-xl)] tabular-nums font-mono ${isFinal && isAwayWinning ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
              {gameToShow.awayScore}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-2.5 flex-1 min-w-0">
              <div className="relative w-7 h-7 md:w-[var(--dash-logo-sm)] md:h-[var(--dash-logo-sm)] flex-shrink-0">
                {gameToShow.homeTeamLogo ? (
                  <Image
                    src={gameToShow.homeTeamLogo}
                    alt={`${gameToShow.homeTeam} logo`}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted/50" />
                )}
              </div>
              <span className={`text-sm md:text-[length:var(--dash-text-base)] truncate ${isFinal && isHomeWinning ? 'font-bold' : 'font-medium'}`}>
                {gameToShow.homeTeam}
              </span>
            </div>
            <span className={`text-base md:text-[length:var(--dash-text-xl)] tabular-nums font-mono ${isFinal && isHomeWinning ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
              {gameToShow.homeScore}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
