'use client';

import { useRecentBooks } from '@/lib/hooks/useKomga';
import { ComicCard } from './ComicCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';

interface RecentlyAddedProps {
  limit?: number;
}

export function RecentlyAdded({ limit = 10 }: RecentlyAddedProps) {
  const { data: books, isLoading, error } = useRecentBooks(limit);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-body-sm text-destructive">
            Failed to load recently added comics. Please check your Komga connection.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-title font-semibold">Recently Added</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-title font-semibold">Recently Added</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No recently added comics found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-title font-semibold">Recently Added</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map((book) => (
          <ComicCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
