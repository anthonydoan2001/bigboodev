'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookById, useBookPages } from '@/lib/hooks/useManga';
import { MangaReader } from '@/components/manga/MangaReader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface ReaderPageProps {
  params: Promise<{ bookId: string }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const { bookId } = use(params);
  const searchParams = useSearchParams();

  // Get navigation context from URL params
  const from = searchParams.get('from'); // 'readlist' or null (series)
  const readlistId = searchParams.get('readlistId');

  // Use fresh: true to ensure we get the latest read progress
  const { book, isLoading: bookLoading, error: bookError } = useBookById(bookId, { fresh: true });
  const { pages, isLoading: pagesLoading, error: pagesError } = useBookPages(bookId);

  const isLoading = bookLoading || pagesLoading;
  const error = bookError || pagesError;

  // Determine back link based on context
  const getBackLink = () => {
    if (from === 'readlist' && readlistId) {
      return `/manga/readlist/${readlistId}`;
    }
    if (book) {
      return `/manga/series/${book.seriesId}`;
    }
    return '/manga';
  };

  const getBackLabel = () => {
    if (from === 'readlist') {
      return 'Back to Reading List';
    }
    return 'Back to Series';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
          <p className="text-white/70">Loading manga...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
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
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <p className="text-destructive">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load book'}
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

  if (pages.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={getBackLink()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getBackLabel()}
            </Link>
          </Button>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold">No Pages Found</h2>
                <p className="text-muted-foreground mt-1">
                  This book doesn&apos;t have any readable pages
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={getBackLink()}>Go Back</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <MangaReader
      book={book}
      pages={pages}
      context={from === 'readlist' && readlistId ? { type: 'readlist', readlistId } : { type: 'series' }}
    />
  );
}
