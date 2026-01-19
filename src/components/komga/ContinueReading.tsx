'use client';

import { useInProgressBooks } from '@/lib/hooks/useKomga';
import { ComicCard } from './ComicCard';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '@/components/watchlist/CardSkeleton';
import { BookOpen } from 'lucide-react';

export function ContinueReading() {
  const { data: books, isLoading, error } = useInProgressBooks();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-body-sm text-destructive">
            Failed to load in-progress comics. Please check your Komga connection.
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
          <h2 className="text-title font-semibold">Continue Reading</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
          <h2 className="text-title font-semibold">Continue Reading</h2>
        </div>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No comics in progress. Start reading to see them here!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-title font-semibold">Continue Reading</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map((book) => (
          <ComicCard key={book.id} book={book} showProgress={true} />
        ))}
      </div>
    </div>
  );
}
