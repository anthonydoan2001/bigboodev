'use client';

import { UniversalSearchResult } from '@/app/api/watchlist/search/universal/route';
import { TopItem } from '@/app/api/watchlist/top/route';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel } from '@/components/watchlist/Carousel';
import { SearchBar } from '@/components/watchlist/SearchBar';
import { WatchlistItem } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ListVideo, Plus, Trash2, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

type ViewMode = 'list' | 'search' | 'top';

export default function WatchlistPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch user's watchlist (always loaded)
  const { data: watchlistData, isLoading: listLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      return res.json();
    },
    staleTime: 60000,
  });

  // Search all content
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['universal-search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/watchlist/search/universal?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Failed to search');
      return res.json();
    },
    enabled: searchQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top items
  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['top-items'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist/top');
      if (!res.ok) throw new Error('Failed to fetch top items');
      return res.json();
    },
    enabled: viewMode === 'top',
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Add to watchlist mutation
  const addMutation = useMutation({
    mutationFn: async (item: UniversalSearchResult) => {
      console.log('Adding to watchlist:', item);
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: String(item.externalId),
          type: item.type.toUpperCase(),
          title: item.title,
          imageUrl: item.image,
          year: item.year,
          rating: item.rating,
          episodes: item.episodes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      console.error('Add error:', error);
      alert(error.message);
    },
  });

  // Delete from watchlist mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setViewMode('search');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setViewMode('list');
  };

  const watchlistItems: WatchlistItem[] = watchlistData?.items || [];
  const searchResults: UniversalSearchResult[] = searchData?.results || [];
  const topItems: TopItem[] = topData?.results || [];

  // Helper to check if item is in watchlist
  const isInWatchlist = (externalId: number, type: string) => {
    return watchlistItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Randomize all watchlist items for the combined section
  const randomizedWatchlist = useMemo(() => {
    const shuffled = [...watchlistItems];
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [watchlistItems]);

  // Group watchlist by type
  const animeList = watchlistItems.filter(item => item.type === 'ANIME');
  const moviesList = watchlistItems.filter(item => item.type === 'MOVIE');
  const showsList = watchlistItems.filter(item => item.type === 'SHOW');

  // Group top items by type
  const topAnime = topItems.filter(item => item.type === 'anime');
  const topMovies = topItems.filter(item => item.type === 'movie');
  const topShows = topItems.filter(item => item.type === 'show');

  // Show search results if there's a query, otherwise show list
  const showingSearch = searchQuery.length > 0;
  const showingTop = viewMode === 'top';

  return (
    <div className="container mx-auto py-8 px-8 min-h-screen max-w-full">
      <div className="w-full space-y-6">
        {/* Navigation and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' && !showingSearch ? 'default' : 'outline'}
              onClick={() => {
                setSearchQuery('');
                setViewMode('list');
              }}
            >
              <ListVideo className="h-4 w-4 mr-2" />
              Watchlist ({watchlistItems.length})
            </Button>
            <Button
              variant={viewMode === 'top' ? 'default' : 'outline'}
              onClick={() => {
                setSearchQuery('');
                setViewMode('top');
              }}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Top
            </Button>
          </div>
          <div className="flex-1 max-w-md">
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="Search anime, movies, and shows..."
              isLoading={searchLoading}
            />
          </div>
        </div>

        {/* Content */}
        {showingSearch ? (
          <div>
            {searchLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground font-medium text-sm">
                  Found {searchResults.length} results for "{searchQuery}"
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {searchResults.map((result) => {
                    const alreadyInList = isInWatchlist(result.externalId, result.type);
                    return (
                      <SearchResultCard
                        key={result.id}
                        result={result}
                        onAdd={() => addMutation.mutate(result)}
                        isAdding={addMutation.isPending}
                        alreadyInList={alreadyInList}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        ) : showingTop ? (
          <div className="space-y-8">
            {topLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="flex gap-4 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <CardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : topItems.length > 0 ? (
              <>
                {/* Top Anime Section */}
                {topAnime.length > 0 && (
                  <Carousel title="Top Anime" count={topAnime.length} icon={<ListVideo className="h-4 w-4" />}>
                    {topAnime.map((item) => {
                      const alreadyInList = isInWatchlist(item.externalId, item.type);
                      return (
                        <div key={item.id} className="flex-shrink-0 w-[180px]">
                          <SearchResultCard
                            result={item}
                            onAdd={() => addMutation.mutate(item as any)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}

                {/* Top Movies Section */}
                {topMovies.length > 0 && (
                  <Carousel title="Top Movies" count={topMovies.length} icon={<ListVideo className="h-4 w-4" />}>
                    {topMovies.map((item) => {
                      const alreadyInList = isInWatchlist(item.externalId, item.type);
                      return (
                        <div key={item.id} className="flex-shrink-0 w-[180px]">
                          <SearchResultCard
                            result={item}
                            onAdd={() => addMutation.mutate(item as any)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}

                {/* Top TV Shows Section */}
                {topShows.length > 0 && (
                  <Carousel title="Top TV Shows" count={topShows.length} icon={<ListVideo className="h-4 w-4" />}>
                    {topShows.map((item) => {
                      const alreadyInList = isInWatchlist(item.externalId, item.type);
                      return (
                        <div key={item.id} className="flex-shrink-0 w-[180px]">
                          <SearchResultCard
                            result={item}
                            onAdd={() => addMutation.mutate(item as any)}
                            isAdding={addMutation.isPending}
                            alreadyInList={alreadyInList}
                          />
                        </div>
                      );
                    })}
                  </Carousel>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>Failed to load top items</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {listLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <div className="flex gap-4 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <CardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : watchlistItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground space-y-4">
                  <p className="text-lg">Your watchlist is empty</p>
                  <p className="text-sm">Use the search bar above to find and add anime, movies, or shows</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Watchlist Section - All items combined in random order */}
                {randomizedWatchlist.length > 0 && (
                  <Carousel title="Watchlist" count={randomizedWatchlist.length} icon={<ListVideo className="h-4 w-4" />}>
                    {randomizedWatchlist.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard item={item} onDelete={() => deleteMutation.mutate(item.id)} />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Anime Section */}
                {animeList.length > 0 && (
                  <Carousel title="Anime" count={animeList.length} icon={<ListVideo className="h-4 w-4" />}>
                    {animeList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard item={item} onDelete={() => deleteMutation.mutate(item.id)} />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Movies Section */}
                {moviesList.length > 0 && (
                  <Carousel title="Movies" count={moviesList.length} icon={<ListVideo className="h-4 w-4" />}>
                    {moviesList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard item={item} onDelete={() => deleteMutation.mutate(item.id)} />
                      </div>
                    ))}
                  </Carousel>
                )}

                {/* Shows Section */}
                {showsList.length > 0 && (
                  <Carousel title="TV Shows" count={showsList.length} icon={<ListVideo className="h-4 w-4" />}>
                    {showsList.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[180px]">
                        <WatchlistCard item={item} onDelete={() => deleteMutation.mutate(item.id)} />
                      </div>
                    ))}
                  </Carousel>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// Loading Skeleton Component
function CardSkeleton() {
  return (
    <div className="space-y-3 w-[180px]">
      <Skeleton className="h-[270px] w-full rounded-xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

// Watchlist Card Component
function WatchlistCard({ item, onDelete }: { item: WatchlistItem; onDelete: () => void }) {
  return (
    <div className="group relative w-[180px] space-y-3">
      <div className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
        {/* Tooltip */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 px-3 py-2 bg-black/90 text-white text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[220px] break-words text-center">
          {item.title}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
        </div>

        <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 180px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
              <span className="text-sm font-medium">No Image</span>
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3 pointer-events-none">
          <div className="pointer-events-auto">
            <Button
              size="sm"
              variant="destructive"
              className="h-9 w-full text-sm font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>

        {/* Rating Badge */}
        {item.rating && (
          <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md flex items-center gap-1 z-10">
            <span className="text-yellow-400">★</span> {item.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground/90 min-h-[2.5rem]" title={item.title}>
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {item.year && <span>{item.year}</span>}
          {item.episodes && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span>{item.episodes} eps</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Search Result Card Component
function SearchResultCard({
  result,
  onAdd,
  isAdding,
  alreadyInList,
}: {
  result: UniversalSearchResult;
  onAdd: () => void;
  isAdding: boolean;
  alreadyInList: boolean;
}) {
  return (
    <div className="group relative w-[180px] space-y-3">
      <div className="relative aspect-[2/3] overflow-visible rounded-xl bg-muted shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20">
        {/* Tooltip */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 px-3 py-2 bg-black/90 text-white text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-[220px] break-words text-center">
          {result.title}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
        </div>

        <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
          {result.image ? (
            <Image
              src={result.image}
              alt={result.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 180px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
              <span className="text-sm font-medium">No Image</span>
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md z-10">
          {result.type}
        </div>

        {/* Added Badge */}
        {alreadyInList && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-xs font-bold text-white backdrop-blur-md shadow-sm z-10">
            <Check className="h-3 w-3" />
            Added
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3 pointer-events-none">
          <div className="pointer-events-auto">
            {alreadyInList ? (
              <Button size="sm" className="h-9 w-full text-sm font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0" disabled variant="secondary">
                <Check className="mr-1.5 h-4 w-4" />
                Saved
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-9 w-full text-sm font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                onClick={onAdd}
                disabled={isAdding}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground/90 min-h-[2.5rem]" title={result.title}>
          {result.title}
        </h3>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {result.rating && (
            <span className="flex items-center gap-1 text-yellow-500">
              ★ {result.rating.toFixed(1)}
            </span>
          )}
          {result.year && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span>{result.year}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
