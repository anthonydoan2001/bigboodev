'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useReadListById, useReadListBooks, useKomgaSettings } from '@/lib/hooks/useManga';
import { getReadListThumbnailUrl } from '@/lib/api/manga';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  List,
  ArrowLeft,
  Play,
  CheckCircle,
  Settings,
} from 'lucide-react';

interface ReadListPageProps {
  params: Promise<{ readlistId: string }>;
}

export default function ReadListPage({ params }: ReadListPageProps) {
  const { readlistId } = use(params);
  const { configured, isLoading: settingsLoading } = useKomgaSettings();
  const { readList, isLoading: readListLoading, error: readListError } = useReadListById(readlistId);
  const { books, isLoading: booksLoading, error: booksError } = useReadListBooks(readlistId, { unpaged: true });
  const [imageError, setImageError] = useState(false);

  const isLoading = settingsLoading || readListLoading || booksLoading;

  if (isLoading) {
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
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Komga not configured
  if (!configured) {
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
              <List className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold">Connect to Komga</h2>
                <p className="text-muted-foreground mt-1">
                  Configure your Komga server to view reading lists
                </p>
              </div>
              <Button asChild>
                <Link href="/manga/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Komga
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (readListError || !readList) {
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
                {readListError instanceof Error
                  ? readListError.message
                  : 'Failed to load reading list'}
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

  // Use lastModifiedDate as cache buster
  const thumbnailUrl = `${getReadListThumbnailUrl(readList.id)}?t=${new Date(readList.lastModifiedDate).getTime()}`;
  const totalBooks = books.length;
  const readBooks = books.filter((b) => b.readProgress?.completed).length;
  const isComplete = readBooks === totalBooks && totalBooks > 0;
  const hasProgress = readBooks > 0 || books.some((b) => (b.readProgress?.page || 0) > 0);

  // Find first unread or in-progress book
  const continueBook = books.find(
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

        {/* Reading List Header */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail */}
          <div className="relative w-48 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              {!imageError ? (
                <Image
                  src={thumbnailUrl}
                  alt={readList.name}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <List className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{readList.name}</h1>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-purple-600 text-white">
                <List className="h-3 w-3 mr-1" />
                Reading List
              </Badge>
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
                {totalBooks} {totalBooks === 1 ? 'issue' : 'issues'}
              </Badge>
              {readList.ordered && (
                <Badge variant="outline">Ordered</Badge>
              )}
            </div>

            {/* Summary */}
            {readList.summary && (
              <p className="text-muted-foreground leading-relaxed">
                {readList.summary}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {continueBook && (
                <Button asChild>
                  <Link href={`/manga/read/${continueBook.id}?from=readlist&readlistId=${readList.id}`}>
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
          <h2 className="text-xl font-semibold">Issues</h2>

          {booksError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-destructive">Failed to load issues</p>
              </CardContent>
            </Card>
          ) : books.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No issues in this reading list</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {books.map((book, index) => {
                const isBookComplete = book.readProgress?.completed || false;
                const currentPage = book.readProgress?.page || 0;
                const totalPages = book.media.pagesCount;
                const hasBookProgress = currentPage > 0 && !isBookComplete;

                return (
                  <Link
                    key={book.id}
                    href={`/manga/read/${book.id}?from=readlist&readlistId=${readList.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="w-8 text-center text-muted-foreground text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm block truncate">
                        {book.metadata.title || book.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {book.seriesTitle}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {totalPages} pages
                    </span>
                    {isBookComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : hasBookProgress ? (
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
