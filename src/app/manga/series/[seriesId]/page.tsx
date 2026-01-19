'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useParams, useRouter } from 'next/navigation';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { BookListItem } from '@/components/komga/BookListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeriesBooks, useSeries } from '@/lib/hooks/useKomga';
import Image from 'next/image';

function SeriesDetailContent() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params?.seriesId as string;

  const { data: booksData, isLoading, refetch } = useSeriesBooks(seriesId);
  const { data: allSeries } = useSeries(1000);
  const series = allSeries?.find(s => s.id === seriesId);

  // Refetch books when page becomes visible (user returns from reader)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to ensure any pending saves have completed
        setTimeout(() => {
          refetch();
        }, 300);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Also refetch when component mounts (in case user navigated directly)
    refetch();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);
  
  // Also refetch when navigating back to this page (using focus event)
  useEffect(() => {
    const handleFocus = () => {
      // Refetch when window regains focus (user navigated back)
      setTimeout(() => {
        refetch();
      }, 300);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch]);

  // Sort books by numberSort to ensure proper order
  const books = useMemo(() => {
    if (!booksData) return [];
    return [...booksData].sort((a, b) => {
      const aNumber = a.metadata?.numberSort ?? 0;
      const bNumber = b.metadata?.numberSort ?? 0;
      return aNumber - bNumber;
    });
  }, [booksData]);

  // Find the last read book (most recently accessed book)
  // Strategy: Find the book with the highest numberSort that has any progress
  // This represents the most recent book the user accessed
  const lastReadBook = useMemo(() => {
    if (!books || books.length === 0) return null;
    
    // Find all books with any read progress (even if just page 1)
    const booksWithProgress = books.filter(book => 
      book.readProgress && book.readProgress.page > 0
    );
    
    if (booksWithProgress.length === 0) {
      // No progress at all, return first book
      return books[0];
    }
    
    // Sort by numberSort descending to find the most recent book (highest number in series)
    const sortedByNumber = [...booksWithProgress].sort((a, b) => {
      const aNumber = a.metadata?.numberSort ?? 0;
      const bNumber = b.metadata?.numberSort ?? 0;
      return bNumber - aNumber; // Descending - highest numberSort first (most recent)
    });
    
    // Return the book with highest numberSort that has progress
    // This is the most recent book the user accessed
    return sortedByNumber[0];
  }, [books]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handleRead = () => {
    if (lastReadBook && !isNavigating) {
      setIsNavigating(true);
      router.push(`/manga/read/${lastReadBook.id}`);
    }
  };

  const seriesTitle = series?.metadata?.title || series?.name || 'Series';

  const seriesThumbnailUrl = seriesId ? `/api/komga/series-thumbnail/${seriesId}` : '';

  if (isLoading) {
    return (
      <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full flex gap-6">
          {/* Left Side - Series Info */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
          {/* Right Side - Books List */}
          <div className="flex-1 space-y-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="py-1 px-2">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full flex gap-6">
          {/* Left Side - Series Info */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/manga')}
              className="h-10 w-10 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted">
              {seriesThumbnailUrl && (
                <Image
                  src={seriesThumbnailUrl}
                  alt={seriesTitle}
                  fill
                  className="object-cover"
                  sizes="256px"
                  unoptimized={true}
                />
              )}
            </div>
            <h1 className="text-xl font-semibold">{seriesTitle}</h1>
          </div>
          {/* Right Side - Empty State */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <p>No books found in this series</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full flex gap-6">
        {/* Left Side - Series Info */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/manga')}
            className="h-10 w-10 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted">
            {seriesThumbnailUrl && (
              <Image
                src={seriesThumbnailUrl}
                alt={seriesTitle}
                fill
                className="object-cover"
                sizes="256px"
                unoptimized={true}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect fill="%231f2937" width="200" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial, sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
            )}
          </div>
          <h1 className="text-xl font-semibold">{seriesTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </p>
          {lastReadBook && (
            <Button
              onClick={handleRead}
              className="w-full"
              size="sm"
              disabled={isNavigating}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {isNavigating ? 'Loading...' : 'Read'}
            </Button>
          )}
        </div>

        {/* Right Side - Books List */}
        <div className="flex-1 space-y-0.5">
          {books.map((book) => (
            <BookListItem key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SeriesDetailPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen py-4 sm:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full flex gap-6">
          {/* Left Side - Series Info */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <Skeleton className="h-10 w-10 rounded mb-4" />
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          {/* Right Side - Books List */}
          <div className="flex-1 space-y-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="py-1 px-2">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SeriesDetailContent />
    </Suspense>
  );
}
