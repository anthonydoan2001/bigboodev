'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCalibreSettings, useCalibreBooks, useBookSearch, useRecentlyRead } from '@/lib/hooks/useBooks';
import { BookGrid } from '@/components/books/BookGrid';
import { BookSearch } from '@/components/books/BookSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, Settings, Loader2, BookOpen } from 'lucide-react';
import { getBookCoverUrl } from '@/lib/api/calibre';
import { CalibreBook } from '@/types/calibre-web';
import Link from 'next/link';
import { useState } from 'react';

function RecentBookCard({ book, progress, format }: { book: CalibreBook; progress: number; format: string }) {
  const [imageError, setImageError] = useState(false);
  const coverUrl = getBookCoverUrl(book.id);
  const href = `/books/read/${book.id}?format=${format}&title=${encodeURIComponent(book.title)}`;
  const percent = Math.round(progress * 100);

  return (
    <Link href={href} className="group flex-shrink-0 w-28">
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3] transition-transform group-hover:scale-[1.02]">
        {!imageError ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity group-hover:opacity-90"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="mt-1.5">
        <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </p>
        <p className="text-[10px] text-muted-foreground">{percent}%</p>
      </div>
    </Link>
  );
}

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

  const { recentProgress } = useRecentlyRead({
    enabled: configured && !search,
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

        {/* Continue Reading */}
        {!search && recentProgress.length > 0 && books.length > 0 && (() => {
          const recentBooks = recentProgress
            .map((p) => {
              const book = books.find((b) => String(b.id) === p.bookId);
              if (!book) return null;
              return { book, progress: p.progress, format: p.format };
            })
            .filter(Boolean) as { book: CalibreBook; progress: number; format: string }[];

          if (recentBooks.length === 0) return null;

          return (
            <section>
              <h2 className="text-lg font-semibold mb-3">Continue Reading</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {recentBooks.map(({ book, progress, format }) => (
                  <RecentBookCard key={book.id} book={book} progress={progress} format={format} />
                ))}
              </div>
            </section>
          );
        })()}

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
