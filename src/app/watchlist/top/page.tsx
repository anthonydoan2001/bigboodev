'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { TopItem } from '@/app/api/watchlist/top/route';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { Carousel } from '@/components/watchlist/Carousel';
import { TopItemCard } from '@/components/watchlist/TopItemCard';
import { WatchlistNav } from '@/components/watchlist/WatchlistNav';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { useWatchlistMutations } from '@/lib/hooks/useWatchlistMutations';
import { useQuery } from '@tanstack/react-query';
import { ListVideo } from 'lucide-react';
import { Suspense, useMemo } from 'react';

function TopContent() {
  const { watchlistItems, watchedItems, watchingItems, allItems, isLoading: watchlistLoading } = useWatchlist();
  const { addMutation, deleteMutation, markWatchedMutation, markWatchingMutation } = useWatchlistMutations();

  const { data: topData, isLoading: topLoading } = useQuery<{ results: TopItem[] }>({
    queryKey: ['top-items'],
    queryFn: async () => {
      const { getAuthHeaders } = await import('@/lib/api-client');
      const res = await fetch('/api/watchlist/top', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch top items');
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

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

  // Filter out items without images or ratings, and exclude items in watchlist/watched/watching
  // Use useMemo to recalculate when watchlist data loads
  const topItems: TopItem[] = useMemo(() => {
    if (!topData?.results) return [];
    
    return topData.results.filter(
      (item: TopItem) => {
        // Basic filters
        if (!item.image || item.image.trim() === '' || !item.rating || item.rating <= 0) {
          return false;
        }
        
        // Only filter out watchlist/watched/watching items if watchlist data has loaded
        if (!watchlistLoading) {
          if (isInWatchlist(item.externalId, item.type) || 
              isWatched(item.externalId, item.type) || 
              isWatching(item.externalId, item.type)) {
            return false;
          }
        }
        
        return true;
      }
    );
  }, [topData, watchlistLoading, watchlistItems, watchedItems, watchingItems]);

  // Helper to get watchlist item ID by externalId and type
  const getWatchlistItemId = (externalId: number, type: string): string | null => {
    const item = allItems.find(
      item => item.externalId === String(externalId) && item.type === type.toUpperCase()
    );
    return item?.id || null;
  };

  // Group top items by type and limit to 20 per category
  const topAnime = topItems.filter(item => item.type === 'anime').slice(0, 20);
  const topMovies = topItems.filter(item => item.type === 'movie').slice(0, 20);
  const topShows = topItems.filter(item => item.type === 'show').slice(0, 20);

  // Calculate available sections
  const sections = [
    { title: 'Top Anime', items: topAnime, key: 'anime' },
    { title: 'Top Movies', items: topMovies, key: 'movies' },
    { title: 'Top TV Shows', items: topShows, key: 'shows' },
  ].filter(section => section.items.length > 0);

  return (
    <div className="w-full py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen">
      <div className="w-full space-y-4 sm:space-y-6">
        <WatchlistNav />

        {topLoading || watchlistLoading ? (
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
        ) : topItems.length > 0 && sections.length > 0 ? (
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={section.key}>
                  {section.key === 'anime' && (
                    <Carousel title={section.title} count={section.items.length} icon={<ListVideo className="h-4 w-4" />} showCount={false}>
                      {section.items.map((item) => {
                        const alreadyInList = isInWatchlist(item.externalId, item.type);
                        const itemWatched = isWatched(item.externalId, item.type);
                        const itemWatching = isWatching(item.externalId, item.type);
                        const itemId = getWatchlistItemId(item.externalId, item.type);
                        return (
                          <div key={item.id} className="flex-shrink-0 snap-start overflow-visible" style={{ width: 'var(--item-width, 200px)', minWidth: 0 }}>
                            <TopItemCard
                              item={item}
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
                  {section.key === 'movies' && (
                    <Carousel title={section.title} count={section.items.length} icon={<ListVideo className="h-4 w-4" />}>
                      {section.items.map((item) => {
                        const alreadyInList = isInWatchlist(item.externalId, item.type);
                        const itemWatched = isWatched(item.externalId, item.type);
                        const itemWatching = isWatching(item.externalId, item.type);
                        const itemId = getWatchlistItemId(item.externalId, item.type);
                        return (
                          <div key={item.id} className="flex-shrink-0 snap-start overflow-visible" style={{ width: 'var(--item-width, 200px)', minWidth: 0 }}>
                            <TopItemCard
                              item={item}
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
                  {section.key === 'shows' && (
                    <Carousel title={section.title} count={section.items.length} icon={<ListVideo className="h-4 w-4" />} showCount={false}>
                      {section.items.map((item) => {
                        const alreadyInList = isInWatchlist(item.externalId, item.type);
                        const itemWatched = isWatched(item.externalId, item.type);
                        const itemWatching = isWatching(item.externalId, item.type);
                        const itemId = getWatchlistItemId(item.externalId, item.type);
                        return (
                          <div key={item.id} className="flex-shrink-0 snap-start overflow-visible" style={{ width: 'var(--item-width, 200px)', minWidth: 0 }}>
                            <TopItemCard
                              item={item}
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
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>Failed to load top items</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function TopPage() {
  return (
    <Suspense fallback={
      <div className="w-full py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8 min-h-screen">
        <div className="w-full space-y-4 sm:space-y-6">
          <div className="h-10 w-full bg-muted animate-pulse rounded" />
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
        </div>
      </div>
    }>
      <TopContent />
    </Suspense>
  );
}
