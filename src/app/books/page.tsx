'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCalibreSettings, useCalibreBooks, useBookSearch } from '@/lib/hooks/useBooks';
import { BookGrid } from '@/components/books/BookGrid';
import { BookSearch } from '@/components/books/BookSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';

function BooksLibraryContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const { configured, isLoading: settingsLoading } = useCalibreSettings();

  const { books, isLoading: booksLoading } = useCalibreBooks('new', {
    enabled: configured && !search,
  });

  const { books: searchResults, isLoading: searchLoading } = useBookSearch(search, {
    enabled: configured && search.length > 0,
  });

  if (settingsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Books</h1>
              <p className="text-muted-foreground">
                Read books from your Calibre-Web server
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Library className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold">Connect to Calibre-Web</h2>
                <p className="text-muted-foreground mt-1">
                  Configure your Calibre-Web server to start reading books
                </p>
              </div>
              <Button asChild>
                <Link href="/books/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Calibre-Web
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isLoading = search ? searchLoading : booksLoading;
  const displayBooks = search ? searchResults : books;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Books</h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-80">
              <BookSearch placeholder="Search books..." />
            </div>
            <Button variant="outline" size="icon" asChild>
              <Link href="/books/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        {search ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {searchLoading ? 'Searching...' : `Results for "${search}"`}
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[2/3] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : displayBooks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No books found for &quot;{search}&quot;</p>
                </CardContent>
              </Card>
            ) : (
              <BookGrid books={displayBooks} />
            )}
          </div>
        ) : (
          isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : displayBooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No books found in your library</p>
              </CardContent>
            </Card>
          ) : (
            <BookGrid books={displayBooks} />
          )
        )}
      </div>
    </div>
  );
}

export default function BooksPage() {
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
      <BooksLibraryContent />
    </Suspense>
  );
}
