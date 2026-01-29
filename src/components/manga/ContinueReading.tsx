'use client';

import { useMemo } from 'react';
import { useBooksInProgress, useReadLists } from '@/lib/hooks/useManga';
import { useQuery } from '@tanstack/react-query';
import { fetchSeriesById } from '@/lib/api/manga';
import { SeriesCard } from './SeriesCard';
import { ReadListCard } from './ReadlistCard';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle } from 'lucide-react';
import { KomgaSeries, KomgaBook, KomgaReadList } from '@/types/komga';

interface ContinueReadingProps {
  limit?: number;
  // Preloaded data from dashboard endpoint (optional for backward compatibility)
  preloadedBooks?: KomgaBook[];
  preloadedReadLists?: KomgaReadList[];
  preloadedSeriesMap?: Record<string, KomgaSeries>;
}

export function ContinueReading({
  limit = 10,
  preloadedBooks,
  preloadedReadLists,
  preloadedSeriesMap,
}: ContinueReadingProps) {
  // Use preloaded data if available, otherwise fall back to individual queries
  const hasPreloadedData = preloadedBooks !== undefined;

  const { books: fetchedBooks, isLoading: booksLoading } = useBooksInProgress({
    size: 50,
    enabled: !hasPreloadedData,
  });
  const { readLists: fetchedReadLists, isLoading: readListsLoading } = useReadLists({
    size: 50,
    enabled: !hasPreloadedData,
  });

  const inProgressBooks = preloadedBooks ?? fetchedBooks;
  const readLists = preloadedReadLists ?? fetchedReadLists;

  // Get in-progress book IDs for matching with reading lists
  const inProgressBookIds = useMemo(() => {
    return new Set(inProgressBooks.map((book) => book.id));
  }, [inProgressBooks]);

  // Find which in-progress books are in reading lists
  const booksInReadLists = useMemo(() => {
    if (!readLists) return new Set<string>();
    const bookIds = new Set<string>();
    readLists.forEach((readList) => {
      readList.bookIds?.forEach((bookId) => {
        if (inProgressBookIds.has(bookId)) {
          bookIds.add(bookId);
        }
      });
    });
    return bookIds;
  }, [readLists, inProgressBookIds]);

  // Filter reading lists that have in-progress books (show these first)
  const inProgressReadLists = useMemo(() => {
    if (!readLists || inProgressBookIds.size === 0) return [];
    return readLists.filter((readList) =>
      readList.bookIds?.some((bookId) => inProgressBookIds.has(bookId))
    );
  }, [readLists, inProgressBookIds]);

  // Get unique series IDs from in-progress books that are NOT in any reading list
  const uniqueSeriesIds = useMemo(() => {
    const ids = new Set<string>();
    inProgressBooks.forEach((book) => {
      // Only include series if the book is NOT in a reading list
      if (!booksInReadLists.has(book.id)) {
        ids.add(book.seriesId);
      }
    });
    return Array.from(ids);
  }, [inProgressBooks, booksInReadLists]);

  // Use preloaded series map if available, otherwise fetch individually (fallback)
  const seriesFromPreload = useMemo(() => {
    if (!preloadedSeriesMap) return [];
    return uniqueSeriesIds
      .map((id) => preloadedSeriesMap[id])
      .filter((s): s is KomgaSeries => s !== undefined);
  }, [preloadedSeriesMap, uniqueSeriesIds]);

  // Only fetch series if we don't have preloaded data
  const seriesQueries = useQuery({
    queryKey: ['manga', 'continue-reading-series', uniqueSeriesIds],
    queryFn: async () => {
      if (uniqueSeriesIds.length === 0) return [];
      const seriesPromises = uniqueSeriesIds.map((id) =>
        fetchSeriesById(id).catch(() => null)
      );
      const results = await Promise.all(seriesPromises);
      return results.filter((s): s is KomgaSeries => s !== null);
    },
    enabled: !hasPreloadedData && uniqueSeriesIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = hasPreloadedData
    ? false
    : booksLoading || readListsLoading || seriesQueries.isLoading;

  const series = hasPreloadedData ? seriesFromPreload : (seriesQueries.data || []);

  // Combine and limit results
  const hasContent = series.length > 0 || inProgressReadLists.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Continue Reading</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return null;
  }

  // Take only up to limit items total - reading lists first, then series
  const limitedReadLists = inProgressReadLists.slice(0, limit);
  const remainingSlots = Math.max(0, limit - limitedReadLists.length);
  const limitedSeries = series.slice(0, remainingSlots);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Continue Reading</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {limitedReadLists.map((readList, index) => (
          <ReadListCard key={readList.id} readList={readList} priority={index < 6} />
        ))}
        {limitedSeries.map((s, index) => (
          <SeriesCard key={s.id} series={s} priority={limitedReadLists.length + index < 6} />
        ))}
      </div>
    </div>
  );
}
