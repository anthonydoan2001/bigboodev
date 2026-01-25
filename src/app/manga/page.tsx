'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSeries, useKomgaSettings } from '@/lib/hooks/useManga';
import { SeriesCard } from '@/components/manga/series-card';
import { ContinueReading } from '@/components/manga/continue-reading';
import { SearchBar } from '@/components/manga/search-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Library, ChevronLeft, ChevronRight, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';

function MangaLibraryContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const { configured, isLoading: settingsLoading } = useKomgaSettings();
  const {
    series,
    totalPages,
    totalElements,
    currentPage,
    isLoading,
    isFetching,
    error,
  } = useSeries({
    page,
    size: 24,
    search: search || undefined,
    enabled: configured,
  });

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
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Manga Library</h1>
              <p className="text-muted-foreground">
                Read manga from your Komga server
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold">Connect to Komga</h2>
                <p className="text-muted-foreground mt-1">
                  Configure your Komga server in Settings to start reading manga
                </p>
              </div>
              <Button asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
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
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Manga Library</h1>
              <p className="text-muted-foreground">
                {totalElements > 0 ? `${totalElements} series` : 'Browse your collection'}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <SearchBar placeholder="Search series..." />
          </div>
        </div>

        {/* Continue Reading */}
        {!search && <ContinueReading limit={6} />}

        {/* Series Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            <h2 className="text-lg font-semibold">
              {search ? `Search Results for "${search}"` : 'All Series'}
            </h2>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

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
                  {error instanceof Error ? error.message : 'Failed to load series'}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : series.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {search
                    ? `No series found for "${search}"`
                    : 'No series found in your library'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {series.map((s) => (
                  <SeriesCard key={s.id} series={s} />
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
                      href={`/manga?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
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
                      href={`/manga?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
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

export default function MangaPage() {
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
      <MangaLibraryContent />
    </Suspense>
  );
}
