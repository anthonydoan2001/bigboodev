'use client';

import { Suspense } from 'react';
import { useCalibreSettings, useCalibreBooks, useRecentlyRead } from '@/lib/hooks/useBooks';
import { BookGrid } from '@/components/books/BookGrid';
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
    <Link href={href} className="group min-w-0">
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
        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </p>
        <p className="text-xs text-muted-foreground">{percent}%</p>
      </div>
    </Link>
  );
}

function BooksLibraryContent() {
  const { configured, isLoading: settingsLoading } = useCalibreSettings();

  const { books, isLoading: booksLoading } = useCalibreBooks('new', {
    enabled: configured,
  });

  const { recentProgress } = useRecentlyRead({
    enabled: configured,
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Books</h1>
          </div>
          <Button variant="outline" size="icon" asChild>
            <Link href="/books/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Continue Reading */}
        {recentProgress.length > 0 && books.length > 0 && (() => {
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recentBooks.slice(0, 6).map(({ book, progress, format }) => (
                  <RecentBookCard key={book.id} book={book} progress={progress} format={format} />
                ))}
              </div>
            </section>
          );
        })()}

        {/* All Books */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">All Books</h2>
          {booksLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No books found in your library</p>
              </CardContent>
            </Card>
          ) : (
            <BookGrid books={books} />
          )}
        </div>
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
