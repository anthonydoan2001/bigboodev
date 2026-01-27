'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSeriesById, useBooks } from '@/lib/hooks/useManga';
import { getSeriesThumbnailUrl } from '@/lib/api/manga';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  Calendar,
  User,
  Tag,
} from 'lucide-react';
import { useState } from 'react';

interface SeriesPageProps {
  params: Promise<{ seriesId: string }>;
}

export default function SeriesPage({ params }: SeriesPageProps) {
  const { seriesId } = use(params);
  const { series, isLoading: seriesLoading, error: seriesError } = useSeriesById(seriesId);
  const { books, isLoading: booksLoading, error: booksError } = useBooks(seriesId, { unpaged: true });
  const [imageError, setImageError] = useState(false);

  if (seriesLoading || booksLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/manga">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Link>
          </Button>

          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-48 aspect-[2/3] rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          {/* Books skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (seriesError || !series) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/manga">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Link>
          </Button>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-destructive">
                {seriesError instanceof Error
                  ? seriesError.message
                  : 'Failed to load series'}
              </p>
              <Button variant="outline" asChild>
                <Link href="/manga">Go Back</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use lastModified as cache buster so thumbnails refresh when updated
  const thumbnailUrl = `${getSeriesThumbnailUrl(series.id)}?t=${new Date(series.lastModified).getTime()}`;
  const metadata = series.metadata;
  const totalBooks = series.booksCount;
  const readBooks = series.booksReadCount;
  const isComplete = readBooks === totalBooks && totalBooks > 0;
  const hasProgress = readBooks > 0 || series.booksInProgressCount > 0;

  // Sort books by number
  const sortedBooks = [...books].sort(
    (a, b) => (a.metadata.numberSort || a.number) - (b.metadata.numberSort || b.number)
  );

  // Find first unread or in-progress book
  const continueBook = sortedBooks.find(
    (book) => !book.readProgress?.completed
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/manga">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Link>
        </Button>

        {/* Series Header */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail */}
          <div className="relative w-48 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              {!imageError ? (
                <Image
                  src={thumbnailUrl}
                  alt={series.name}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">
                {metadata.title || series.name}
              </h1>
              {metadata.publisher && (
                <p className="text-lg text-muted-foreground mt-1">
                  {metadata.publisher}
                </p>
              )}
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {isComplete ? (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : hasProgress ? (
                <Badge variant="secondary">
                  {readBooks} / {totalBooks} read
                </Badge>
              ) : (
                <Badge variant="outline">Unread</Badge>
              )}
              <Badge variant="outline">
                {totalBooks} {totalBooks === 1 ? 'book' : 'books'}
              </Badge>
              {metadata.status && metadata.status !== 'ONGOING' && (
                <Badge variant="outline">{metadata.status}</Badge>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {metadata.ageRating && (
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {metadata.ageRating}+
                </span>
              )}
              {series.booksMetadata.authors.length > 0 && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {series.booksMetadata.authors
                    .slice(0, 2)
                    .map((a) => a.name)
                    .join(', ')}
                </span>
              )}
              {series.booksMetadata.releaseDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {series.booksMetadata.releaseDate}
                </span>
              )}
            </div>

            {/* Genres */}
            {metadata.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {metadata.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Summary */}
            {metadata.summary && (
              <p className="text-muted-foreground leading-relaxed">
                {metadata.summary}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {continueBook && (
                <Button asChild>
                  <Link href={`/manga/read/${continueBook.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    {continueBook.readProgress
                      ? 'Continue Reading'
                      : 'Start Reading'}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Books List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Books</h2>

          {booksError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-destructive">Failed to load books</p>
              </CardContent>
            </Card>
          ) : sortedBooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No books found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {sortedBooks.map((book) => {
                const isComplete = book.readProgress?.completed || false;
                const currentPage = book.readProgress?.page || 0;
                const totalPages = book.media.pagesCount;
                const hasProgress = currentPage > 0 && !isComplete;

                return (
                  <Link
                    key={book.id}
                    href={`/manga/read/${book.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="w-8 text-center text-muted-foreground text-sm">
                      {book.metadata.numberSort || book.number}
                    </span>
                    <span className="flex-1 text-sm">
                      {book.metadata.title || book.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {totalPages} pages
                    </span>
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : hasProgress ? (
                      <span className="text-xs text-blue-600">
                        {currentPage}/{totalPages}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
