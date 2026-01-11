'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { TopItem } from '@/app/api/watchlist/top/route';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { Carousel } from '@/components/watchlist/Carousel';
import { SearchResultCard } from '@/components/watchlist/SearchResultCard';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useQuery } from '@tanstack/react-query';
import { ListVideo } from 'lucide-react';
import { Suspense } from 'react';

function TopContent() {
  const { watchlistItems, watchedItems, watchingItems, allItems } = useWatchlist();
  const { addMutation, deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();

  const { data: topData, isLoading: topLoading } = useQuery<{ results: TopItem[] }>({
    queryKey: ['top-items'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist/top');
      if (!res.ok) throw new Error('Failed to fetch top items');
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Filter out items without images or ratings from top items
  const topItems: TopItem[] = (topData?.results || []).filter(
    (item: TopItem) => 
      item.image && 
      item.image.trim() !== '' && 
      item.rating && 
      item.rating > 0
  );

  // Helper to check if item is in watchlist
  const isInWatchlist = (externalId: number, type: string) => {
    return watchlistItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to check if item is watched
  const isWatched = (externalId: number, type: string) => {
    return watchedItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to check if item is watching
  const isWatching = (externalId: number, type: string) => {
    return watchingItems.some(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
  };

  // Helper to get watchlist item ID by externalId and type
  const getWatchlistItemId = (externalId: number, type: string): string | null => {
    const item = allItems.find(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
    return item?.id || null;
  };

  // Group top items by type
  const topAnime = topItems.filter(item => item.type === 'anime');
  const topMovies = topItems.filter(item => item.type === 'movie');
  const topShows = topItems.filter(item => item.type === 'show');

  return (
    <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
      <div className="w-full space-y-6">
        <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded" />}>
          <WatchlistNav />
        </Suspense>

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
                    const itemWatched = isWatched(item.externalId, item.type);
                    const itemWatching = isWatching(item.externalId, item.type);
                    const itemId = getWatchlistItemId(item.externalId, item.type);
                    return (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <SearchResultCard
                          result={{
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            image: item.image ?? '',
                            year: item.year ?? null,
                            rating: item.rating ?? null,
                            episodes: item.episodes ?? null,
                            externalId: item.externalId,
                          }}
                          onAdd={() => addMutation.mutate({
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            image: item.image ?? '',
                            year: item.year ?? null,
                            rating: item.rating ?? null,
                            episodes: item.episodes ?? null,
                            externalId: item.externalId,
                          })}
                          isAdding={addMutation.isPending}
                          alreadyInList={alreadyInList}
                          isWatched={itemWatched}
                          isWatching={itemWatching}
                          onMarkWatched={() => markWatchedMutation.mutate({
                            item: {
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              image: item.image ?? '',
                              year: item.year ?? null,
                              rating: item.rating ?? null,
                              episodes: item.episodes ?? null,
                              externalId: item.externalId,
                            }
                          })}
                          isMarkingWatched={markWatchedMutation.isPending}
                          onMarkWatching={() => markWatchingMutation.mutate({
                            item: {
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              image: item.image ?? '',
                              year: item.year ?? null,
                              rating: item.rating ?? null,
                              episodes: item.episodes ?? null,
                              externalId: item.externalId,
                            }
                          })}
                          isMarkingWatching={markWatchingMutation.isPending}
                          onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
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
                    const itemWatched = isWatched(item.externalId, item.type);
                    const itemWatching = isWatching(item.externalId, item.type);
                    const itemId = getWatchlistItemId(item.externalId, item.type);
                    return (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <SearchResultCard
                          result={{
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            image: item.image ?? '',
                            year: item.year ?? null,
                            rating: item.rating ?? null,
                            episodes: item.episodes ?? null,
                            externalId: item.externalId,
                          }}
                          onAdd={() => addMutation.mutate({
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            image: item.image ?? '',
                            year: item.year ?? null,
                            rating: item.rating ?? null,
                            episodes: item.episodes ?? null,
                            externalId: item.externalId,
                          })}
                          isAdding={addMutation.isPending}
                          alreadyInList={alreadyInList}
                          isWatched={itemWatched}
                          isWatching={itemWatching}
                          onMarkWatched={() => markWatchedMutation.mutate({
                            item: {
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              image: item.image ?? '',
                              year: item.year ?? null,
                              rating: item.rating ?? null,
                              episodes: item.episodes ?? null,
                              externalId: item.externalId,
                            }
                          })}
                          isMarkingWatched={markWatchedMutation.isPending}
                          onMarkWatching={() => markWatchingMutation.mutate({
                            item: {
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              image: item.image ?? '',
                              year: item.year ?? null,
                              rating: item.rating ?? null,
                              episodes: item.episodes ?? null,
                              externalId: item.externalId,
                            }
                          })}
                          isMarkingWatching={markWatchingMutation.isPending}
                          onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
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
                    const itemWatched = isWatched(item.externalId, item.type);
                    const itemWatching = isWatching(item.externalId, item.type);
                    const itemId = getWatchlistItemId(item.externalId, item.type);
                    return (
                      <div key={item.id} className="flex-shrink-0 snap-start" style={{ width: 'var(--item-width, 200px)' }}>
                        <SearchResultCard
                          result={{
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            image: item.image ?? '',
                            year: item.year ?? null,
                            rating: item.rating ?? null,
                            episodes: item.episodes ?? null,
                            externalId: item.externalId,
                          }}
                          onAdd={() => addMutation.mutate({
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            image: item.image ?? '',
                            year: item.year ?? null,
                            rating: item.rating ?? null,
                            episodes: item.episodes ?? null,
                            externalId: item.externalId,
                          })}
                          isAdding={addMutation.isPending}
                          alreadyInList={alreadyInList}
                          isWatched={itemWatched}
                          isWatching={itemWatching}
                          onMarkWatched={() => markWatchedMutation.mutate({
                            item: {
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              image: item.image ?? '',
                              year: item.year ?? null,
                              rating: item.rating ?? null,
                              episodes: item.episodes ?? null,
                              externalId: item.externalId,
                            }
                          })}
                          isMarkingWatched={markWatchedMutation.isPending}
                          onMarkWatching={() => markWatchingMutation.mutate({
                            item: {
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              image: item.image ?? '',
                              year: item.year ?? null,
                              rating: item.rating ?? null,
                              episodes: item.episodes ?? null,
                              externalId: item.externalId,
                            }
                          })}
                          isMarkingWatching={markWatchingMutation.isPending}
                          onDelete={itemId ? () => deleteMutation.mutate(itemId) : undefined}
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
      </div>
    </div>
  );
}

export default function TopPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-8 px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-center">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 8 }).map((_, j) => (
                <CardSkeleton key={j} />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <TopContent />
    </Suspense>
  );
}
