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
import { useEffect, useState, useRef, Suspense, useMemo, useCallback } from 'react';
import { getAuthHeaders } from '@/lib/api-client';
import { useRouter, useSearchParams } from 'next/navigation';

// Format date string helper - moved outside component for reuse
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchScores(sport: SportType, date: Date) {
  const dateStr = formatDateString(date);

  const response = await fetch(`/api/sports/scores?sport=${sport}&date=${dateStr}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch scores');
  }
  const data = await response.json();
  // Convert date strings back to Date objects
  return data.scores.map((game: any) => ({
    ...game,
    startTime: new Date(game.startTime),
  })) as GameScore[];
}

async function fetchTopPerformers(sport: SportType, date: Date) {
  const dateStr = formatDateString(date);

  const response = await fetch(`/api/sports/performers?sport=${sport}&date=${dateStr}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
    cache: 'no-store',
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

function SportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get initial values from URL or use defaults
  const urlTab = searchParams.get('tab') || 'games';
  const urlSport = searchParams.get('sport') || 'NBA';
  const urlDate = searchParams.get('date');

  const [selectedSport, setSelectedSport] = useState<SportType | 'FAVORITES'>(
    (urlSport === 'FAVORITES' || urlSport === 'NBA') ? urlSport : 'NBA'
  );
  const [selectedTab, setSelectedTab] = useState<string>(
    ['games', 'performers', 'standings'].includes(urlTab) ? urlTab : 'games'
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (urlDate) {
      const parsedDate = new Date(urlDate);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    return new Date();
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Track previous game statuses to detect when games finish
  const previousGameStatuses = useRef<Map<string, 'scheduled' | 'live' | 'final'>>(new Map());

  // Sync URL params with state on mount
  useEffect(() => {
    setFavorites(getFavorites());
    setIsMounted(true);
  }, []);

  // Ensure date is in URL for games/performers tabs
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'games';
    const urlDate = searchParams.get('date');

    // Add today's date to URL if missing and we're on games or performers tab
    if (isMounted && !urlDate && urlTab !== 'standings') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('date', dateStr);
      router.push(`/sports?${currentParams.toString()}`, { scroll: false });
    }
  }, [isMounted, searchParams, router, selectedDate]);

  // Sync state with URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'games';
    const urlSport = searchParams.get('sport') || 'NBA';
    const urlDate = searchParams.get('date');

    // Update sport if different
    const newSport = (urlSport === 'FAVORITES' || urlSport === 'NBA') ? urlSport : 'NBA';
    if (newSport !== selectedSport) {
      setSelectedSport(newSport as SportType | 'FAVORITES');
    }

    // Update tab if different
    const newTab = ['games', 'performers', 'standings'].includes(urlTab) ? urlTab : 'games';
    if (newTab !== selectedTab) {
      setSelectedTab(newTab);
    }

    // Update date if different (only for games/performers tabs)
    if (urlDate && newTab !== 'standings') {
      const parsedDate = new Date(urlDate);
      if (!isNaN(parsedDate.getTime())) {
        const currentDateStr = selectedDate.toISOString().split('T')[0];
        const urlDateStr = parsedDate.toISOString().split('T')[0];
        if (currentDateStr !== urlDateStr) {
          setSelectedDate(parsedDate);
        }
      }
    }
  }, [searchParams]); // Re-run when URL params change

  // Update URL when state changes - memoized
  const updateURL = useCallback((params: { sport?: string; tab?: string; date?: string; removeDate?: boolean }) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    if (params.sport !== undefined) {
      currentParams.set('sport', params.sport);
    }
    if (params.tab !== undefined) {
      currentParams.set('tab', params.tab);
    }
    if (params.date !== undefined) {
      currentParams.set('date', params.date);
    }
    if (params.removeDate) {
      currentParams.delete('date');
    }

    router.push(`/sports?${currentParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Handle sport change - memoized
  const handleSportChange = useCallback((sport: SportType | 'FAVORITES') => {
    setSelectedSport(sport);
    updateURL({ sport });
  }, [updateURL]);

  // Handle tab change - memoized
  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab);
    if (tab === 'standings') {
      updateURL({ tab, removeDate: true });
    } else {
      const dateStr = selectedDate.toISOString().split('T')[0];
      updateURL({ tab, date: dateStr });
    }
  }, [selectedDate, updateURL]);

  // Handle date change - memoized
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    updateURL({ date: dateStr });
  }, [updateURL]);

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
    refetchInterval: (query) => {
      const data = query.state.data;
      // Only auto-refresh if there are live games - refresh every 30 seconds
      if (Array.isArray(data) && data.some(game => game.status === 'live')) {
        return 30000;
      }
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
    refetchInterval: (query) => {
      const data = query.state.data;
      // Only auto-refresh if there are live games
      if (Array.isArray(data) && data.some(game => game.status === 'live')) {
        return 30000;
      }
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

  const handleToggleFavorite = useCallback((gameId: string) => {
    toggleFavoriteInStorage(gameId);
    setFavorites(getFavorites());
  }, []);

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
    refetchInterval: () => {
      // Only auto-refresh performers if there are live games
      const hasLiveGames = Array.isArray(scores) && scores.some(game => game.status === 'live');
      return hasLiveGames ? 30000 : false;
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

  // Determine which games to show - memoized for performance
  const currentScores = useMemo(() =>
    isFavoritesView ? favoriteQueries.data : scores,
    [isFavoritesView, favoriteQueries.data, scores]
  );
  const currentLoading = !isMounted || (isFavoritesView ? favoriteQueries.isLoading : scoresLoading);
  const currentError = isFavoritesView ? favoriteQueries.error : scoresError;

  // Memoized game filtering - avoid recalculating on every render
  const gamesToShow = useMemo(() => {
    if (!currentScores) return [];

    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    // Filter by favorites if in favorites view
    const filtered = isFavoritesView
      ? currentScores.filter(game => favorites.includes(game.id))
      : currentScores;

    // Exclude completed games older than 24 hours
    return filtered.filter(game => {
      if (game.status !== 'final') return true;
      return (now - game.startTime.getTime()) <= twentyFourHoursMs;
    });
  }, [currentScores, isFavoritesView, favorites]);

  // Check if there are any live games - memoized
  const hasLiveGames = useMemo(() =>
    gamesToShow.some(game => game.status === 'live'),
    [gamesToShow]
  );
  const isAutoRefreshing = hasLiveGames && (scoresFetching || favoriteQueries.isFetching);

  // Detect when games finish and update standings
  useEffect(() => {
    if (!currentScores || !isMounted) return;

    let gamesJustFinished = false;

    currentScores.forEach(game => {
      const previousStatus = previousGameStatuses.current.get(game.id);

      // Detect if a game just finished (live -> final)
      if (previousStatus === 'live' && game.status === 'final') {
        gamesJustFinished = true;
      }

      // Update the tracked status
      previousGameStatuses.current.set(game.id, game.status);
    });

    // If any games just finished, invalidate standings to trigger refresh
    if (gamesJustFinished && selectedSport === 'NBA') {
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
              onSportChange={handleSportChange}
            />
            {/* Only show date navigator for games and performers tabs */}
            {selectedTab !== 'standings' && (
              <DateNavigator
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            )}
          </div>

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
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger value="games" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Games
              </TabsTrigger>
              <TabsTrigger value="performers" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Top Performers
              </TabsTrigger>
              <TabsTrigger value="standings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Standings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games" className="mt-6">
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

export default function SportsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-8 min-h-screen max-w-full">
        <div className="w-full space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full xl:w-auto">
              <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
              <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="mt-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SportsPageContent />
    </Suspense>
  );
}
