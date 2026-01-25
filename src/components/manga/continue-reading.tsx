'use client';

import { useMemo } from 'react';
import { useBooksInProgress, useReadLists } from '@/lib/hooks/useManga';
import { useQuery } from '@tanstack/react-query';
import { fetchSeriesById } from '@/lib/api/manga';
import { SeriesCard } from './series-card';
import { ReadListCard } from './readlist-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle } from 'lucide-react';
import { KomgaSeries } from '@/types/komga';

interface ContinueReadingProps {
  limit?: number;
}

export function ContinueReading({ limit = 10 }: ContinueReadingProps) {
  const { books: inProgressBooks, isLoading: booksLoading } = useBooksInProgress({ size: 50 });
  const { readLists, isLoading: readListsLoading } = useReadLists({ size: 50 });

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

  // Fetch series data for each unique series ID (only for books not in reading lists)
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
    enabled: uniqueSeriesIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = booksLoading || readListsLoading || seriesQueries.isLoading;
  const series = seriesQueries.data || [];

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
        {limitedReadLists.map((readList) => (
          <ReadListCard key={readList.id} readList={readList} />
        ))}
        {limitedSeries.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </div>
  );
}
