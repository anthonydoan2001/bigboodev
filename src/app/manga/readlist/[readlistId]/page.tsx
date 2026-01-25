'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useReadListById, useReadListBooks, useKomgaSettings } from '@/lib/hooks/useManga';
import { BookCard } from '@/components/manga/book-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { List, ChevronLeft, ChevronRight, Settings, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ReadListPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const readlistId = params.readlistId as string;
  const page = parseInt(searchParams.get('page') || '0', 10);

  const { configured, isLoading: settingsLoading } = useKomgaSettings();
  const { readList, isLoading: readListLoading } = useReadListById(readlistId);
  const {
    books,
    totalPages,
    totalElements,
    currentPage,
    isLoading: booksLoading,
    isFetching,
    error,
  } = useReadListBooks(readlistId, {
    page,
    size: 24,
  });

  const isLoading = settingsLoading || readListLoading || booksLoading;

  // Settings not loaded yet
  if (settingsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Komga not configured
  if (!configured) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <List className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Reading List</h1>
              <p className="text-muted-foreground">
                Configure your Komga server first
              </p>
            </div>
          </div>

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="mr-1">
              <Link href="/manga">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <List className="h-8 w-8 text-purple-500" />
            <div>
              {readListLoading ? (
                <>
                  <Skeleton className="h-8 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{readList?.name || 'Reading List'}</h1>
                  <p className="text-muted-foreground">
                    {totalElements > 0 ? `${totalElements} issues` : 'No issues in this list'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/manga/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Description */}
        {readList?.summary && (
          <p className="text-muted-foreground max-w-2xl">
            {readList.summary}
          </p>
        )}

        {/* Books Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-destructive">
                  {error instanceof Error ? error.message : 'Failed to load books'}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : books.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No issues in this reading list
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {isFetching && !booksLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {books.map((book, index) => (
                  <div key={book.id} className="relative">
                    {/* Reading order number */}
                    {readList?.ordered && (
                      <div className="absolute -top-2 -left-2 z-10 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {currentPage * 24 + index + 1}
                      </div>
                    )}
                    <BookCard book={book} showSeriesTitle />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    asChild
                  >
                    <Link
                      href={`/manga/readlist/${readlistId}?page=${currentPage - 1}`}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Link>
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    asChild
                  >
                    <Link
                      href={`/manga/readlist/${readlistId}?page=${currentPage + 1}`}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReadListPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <ReadListPageContent />
    </Suspense>
  );
}
