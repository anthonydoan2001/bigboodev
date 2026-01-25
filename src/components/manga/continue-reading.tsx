'use client';

import { useBooksInProgress } from '@/lib/hooks/useManga';
import { BookCard } from './book-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle } from 'lucide-react';

interface ContinueReadingProps {
  limit?: number;
}

export function ContinueReading({ limit = 10 }: ContinueReadingProps) {
  const { books, isLoading, error } = useBooksInProgress({ size: limit });

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

  if (error || books.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Continue Reading</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} showSeriesTitle hideProgress />
        ))}
      </div>
    </div>
  );
}
