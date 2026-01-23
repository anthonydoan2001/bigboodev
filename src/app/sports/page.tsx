'use client';

import { DateNavigator } from '@/components/sports/DateNavigator';
import { ScoreCard } from '@/components/sports/ScoreCard';
import { ScoreCardSkeleton } from '@/components/sports/ScoreCardSkeleton';
import { SportFilter } from '@/components/sports/SportFilter';
import { TopPerformersView } from '@/components/sports/TopPerformersView';
import { TopPerformersSkeleton } from '@/components/sports/TopPerformersSkeleton';
import { Standings } from '@/components/sports/Standings';
import { StandingsSkeleton } from '@/components/sports/StandingsSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { autoFavoriteHoustonGames, getFavorites, isHoustonGame, toggleFavorite as toggleFavoriteInStorage } from '@/lib/favorites';
import { GameScore, SportType, TeamStanding, TopPerformer } from '@/types/sports';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { getAuthHeaders } from '@/lib/api-client';

async function fetchScores(sport: SportType, date: Date) {
  // Format date in local timezone as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const response = await fetch(`/api/sports/scores?sport=${sport}&date=${dateStr}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store', // Don't cache - we need fresh data for live games
  });
  if (!response.ok) {
    throw new Error('Failed to fetch scores');
  }
  const data = await response.json();
  // Log fetch for debugging
  console.log(`[Sports] Fetched ${sport} scores:`, {
    count: data.scores?.length || 0,
    cached: data.cached,
    timestamp: data.timestamp,
    hasLive: data.scores?.some((g: any) => g.status === 'live'),
  });
  // Convert date strings back to Date objects
  return data.scores.map((game: any) => ({
    ...game,
    startTime: new Date(game.startTime),
  })) as GameScore[];
}

async function fetchTopPerformers(sport: SportType, date: Date) {
  // Format date in local timezone as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const response = await fetch(`/api/sports/performers?sport=${sport}&date=${dateStr}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store', // Don't cache - we need fresh data for live games
  });
  if (!response.ok) {
    throw new Error('Failed to fetch top performers');
  }
  const data = await response.json();
  return data.performers as TopPerformer[];
}

async function fetchStandings(sport: SportType) {
  const response = await fetch(`/api/sports/standings?sport=${sport}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch standings');
  }
  const data = await response.json();
  return data.standings as TeamStanding[];
}

export default function SportsPage() {
  const queryClient = useQueryClient();
  const [selectedSport, setSelectedSport] = useState<SportType | 'FAVORITES'>('NBA');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Track previous game statuses to detect when games finish
  const previousGameStatuses = useRef<Map<string, 'scheduled' | 'live' | 'final'>>(new Map());

  // Load favorites and set mounted flag on mount
  useEffect(() => {
    setFavorites(getFavorites());
    setIsMounted(true);
  }, []);

  const showPerformers = selectedSport === 'NBA'; // Only show performers for NBA
  const isFavoritesView = selectedSport === 'FAVORITES';

  // For favorites view, we need to fetch all sports and filter by favorites
  const shouldFetchScores = selectedSport !== 'FAVORITES';

  // Use selected date for scores
  const dateForScores = selectedDate;

  const {
    data: scores,
    isLoading: scoresLoading,
    error: scoresError,
    isFetching: scoresFetching,
  } = useQuery({
    queryKey: ['scores', selectedSport, dateForScores.toDateString()],
    queryFn: () => fetchScores(selectedSport as SportType, dateForScores),
    staleTime: 0, // Always consider data stale so refetchInterval works properly
    refetchOnWindowFocus: false,
    enabled: shouldFetchScores && isMounted,
    refetchInterval: (data) => {
      // Only auto-refresh if there are live games - refresh every 30 seconds
      if (Array.isArray(data) && data.some(game => game.status === 'live')) {
        return 30000; // 30 seconds for live games
      }
      // No auto-refresh for scheduled/final games - user can manually refresh
      return false;
    },
  });

  // Fetch all sports for favorites view
  const allSports: SportType[] = ['NBA'];

  const favoriteQueries = useQuery({
    queryKey: ['all-scores', selectedDate.toDateString()],
    queryFn: async () => {
      const results = await Promise.all(
        allSports.map(sport => fetchScores(sport, selectedDate))
      );
      return results.flat();
    },
    staleTime: 0, // Always consider data stale so refetchInterval works properly
    refetchOnWindowFocus: false,
    enabled: isFavoritesView && isMounted,
    refetchInterval: (data) => {
      // Only auto-refresh if there are live games - refresh every 30 seconds
      if (Array.isArray(data) && data.some(game => game.status === 'live')) {
        return 30000; // 30 seconds for live games
      }
      // No auto-refresh for scheduled/final games - user can manually refresh
      return false;
    },
  });

  // Auto-favorite Houston games when scores load
  useEffect(() => {
    if (scores && scores.length > 0) {
      autoFavoriteHoustonGames(scores);
      setFavorites(getFavorites());
    }
  }, [scores]);

  // Auto-favorite Houston games in favorites view
  useEffect(() => {
    if (favoriteQueries.data && favoriteQueries.data.length > 0) {
      autoFavoriteHoustonGames(favoriteQueries.data);
      setFavorites(getFavorites());
    }
  }, [favoriteQueries.data]);

  const handleToggleFavorite = (gameId: string) => {
    toggleFavoriteInStorage(gameId);
    setFavorites(getFavorites());
  };

  const {
    data: performers,
    isLoading: performersLoading,
    error: performersError,
  } = useQuery({
    queryKey: ['performers', selectedSport, selectedDate.toDateString()],
    queryFn: () => {
      // Type guard: ensure selectedSport is a valid SportType
      if (selectedSport === 'FAVORITES') {
        throw new Error('Cannot fetch performers for FAVORITES');
      }
      return fetchTopPerformers(selectedSport, selectedDate);
    },
    staleTime: 0, // Always consider data stale so refetchInterval works properly
    refetchOnWindowFocus: false,
    enabled: selectedSport === 'NBA' && isMounted, // Only for NBA and after mount
    refetchInterval: (data) => {
      // Only auto-refresh performers if there are live games - refresh every 30 seconds
      const hasLiveGames = Array.isArray(scores) && scores.some(game => game.status === 'live');
      if (hasLiveGames) {
        return 30000; // 30 seconds for live games
      }
      // No auto-refresh for completed/scheduled games - user can manually refresh
      return false;
    },
  });

  const {
    data: standings,
    isLoading: standingsLoading,
    error: standingsError,
  } = useQuery({
    queryKey: ['standings', selectedSport],
    queryFn: () => {
      // Type guard: ensure selectedSport is a valid SportType
      if (selectedSport === 'FAVORITES') {
        throw new Error('Cannot fetch standings for FAVORITES');
      }
      return fetchStandings(selectedSport);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    enabled: selectedSport === 'NBA' && isMounted, // Only for NBA and after mount
  });

  // Determine which games to show
  const currentScores = isFavoritesView ? favoriteQueries.data : scores;
  const currentLoading = !isMounted || (isFavoritesView ? favoriteQueries.isLoading : scoresLoading);
  const currentError = isFavoritesView ? favoriteQueries.error : scoresError;

  // Helper function to check if a completed game is older than 24 hours
  const isCompletedGameOld = (game: GameScore): boolean => {
    if (game.status !== 'final') return false;
    const now = new Date();
    const gameTime = game.startTime;
    const hoursSinceGame = (now.getTime() - gameTime.getTime()) / (1000 * 60 * 60);
    // Remove completed games that are more than 24 hours old
    return hoursSinceGame > 24;
  };

  // Filter games for favorites or use regular scores, exclude completed games older than 24 hours
  const filteredScores = isFavoritesView
    ? currentScores?.filter(game => favorites.includes(game.id))
    : currentScores;
  const gamesToShow = (filteredScores || []).filter(game => !isCompletedGameOld(game));

  // Check if there are any live games
  const hasLiveGames = Array.isArray(gamesToShow) && gamesToShow.some(game => game.status === 'live');
  const isAutoRefreshing = hasLiveGames && (scoresFetching || favoriteQueries.isFetching);

  // Detect when games finish and update standings
  useEffect(() => {
    if (!currentScores || !isMounted) return;

    let gamesJustFinished = false;

    currentScores.forEach(game => {
      const previousStatus = previousGameStatuses.current.get(game.id);

      // Detect if a game just finished (live -> final)
      if (previousStatus === 'live' && game.status === 'final') {
        console.log(`[Standings Update] Game finished: ${game.awayTeam} vs ${game.homeTeam}`);
        gamesJustFinished = true;
      }

      // Update the tracked status
      previousGameStatuses.current.set(game.id, game.status);
    });

    // If any games just finished, invalidate standings to trigger refresh
    if (gamesJustFinished && selectedSport === 'NBA') {
      console.log('[Standings Update] Refreshing standings due to finished games');
      queryClient.invalidateQueries({ queryKey: ['standings', selectedSport] });
    }
  }, [currentScores, isMounted, selectedSport, queryClient]);

  return (
    <div className="container mx-auto py-8 px-8 min-h-screen max-w-full">
      <div className="w-full space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center w-full xl:w-auto">
            <SportFilter
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
            />
            <DateNavigator
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          {/* Live Update Indicator */}
          {hasLiveGames && (
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {isFavoritesView ? (
          // No tabs for favorites view, just show the games
          <div className="mt-6">
            {currentLoading ? (
              <div className="px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ScoreCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : currentError ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-body-sm text-destructive">
                    Error loading favorites. Please try again.
                  </div>
                </CardContent>
              </Card>
            ) : !gamesToShow || gamesToShow.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-body-sm text-muted-foreground">
                    No favorite games. Star games to add them here!
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {gamesToShow.map((game) => (
                    <ScoreCard
                      key={game.id}
                      game={game}
                      isFavorite={favorites.includes(game.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isHoustonGame={isHoustonGame(game.homeTeam, game.awayTeam)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger value="scores" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Games
              </TabsTrigger>
              <TabsTrigger value="performers" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Top Performers
              </TabsTrigger>
              <TabsTrigger value="standings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Standings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scores" className="mt-6">
              {currentLoading ? (
                  <div className="px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <ScoreCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                ) : currentError ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-body-sm text-destructive">
                        Error loading scores. Please try again.
                      </div>
                    </CardContent>
                  </Card>
                ) : !gamesToShow || gamesToShow.length === 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-body-sm text-muted-foreground">
                        No games today for {selectedSport}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {gamesToShow.map((game) => (
                        <ScoreCard
                          key={game.id}
                          game={game}
                          isFavorite={favorites.includes(game.id)}
                          onToggleFavorite={handleToggleFavorite}
                          isHoustonGame={isHoustonGame(game.homeTeam, game.awayTeam)}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="performers" className="mt-6">
              <div className="max-w-7xl mx-auto">
                {(!isMounted || performersLoading) ? (
                  <TopPerformersSkeleton />
                ) : performersError ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-body-sm text-destructive">
                        Error loading top performers. Please try again.
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <TopPerformersView performers={performers || []} sport={selectedSport} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="standings" className="mt-6">
              <div className="max-w-7xl mx-auto px-4">
                {(!isMounted || standingsLoading) ? (
                  <StandingsSkeleton />
                ) : standingsError ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-body-sm text-destructive">
                        Error loading standings. Please try again.
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Standings standings={standings || []} />
                )}
              </div>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </div>
  );
}
