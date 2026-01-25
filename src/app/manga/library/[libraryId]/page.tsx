'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSeries, useKomgaSettings, useLibraries } from '@/lib/hooks/useManga';
import { SeriesCard } from '@/components/manga/series-card';
import { SearchBar } from '@/components/manga/search-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronLeft, ChevronRight, Settings, Loader2, BookMarked, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function LibraryPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const libraryId = params.libraryId as string;
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const { configured, isLoading: settingsLoading } = useKomgaSettings();
  const { libraries, isLoading: librariesLoading } = useLibraries({ enabled: configured });

  const library = libraries.find((l) => l.id === libraryId);

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
    libraryId,
    enabled: configured && !!libraryId,
  });

  // Determine icon based on library name
  const isComic = library?.name.toLowerCase().includes('comic');
  const Icon = isComic ? BookMarked : BookOpen;

  // Settings not loaded yet
  if (settingsLoading || librariesLoading) {
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
              <h1 className="text-3xl font-bold">Library</h1>
              <p className="text-muted-foreground">
                Configure your Komga server first
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold">Connect to Komga</h2>
                <p className="text-muted-foreground mt-1">
                  Configure your Komga server to start reading
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

  // Library not found
  if (!library) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/manga">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Link>
          </Button>

          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Library not found</p>
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
            <Icon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{library.name}</h1>
              <p className="text-muted-foreground">
                {totalElements > 0 ? `${totalElements} series` : 'Browse collection'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-80">
              <SearchBar placeholder={`Search ${library.name.toLowerCase()}...`} />
            </div>
            <Button variant="outline" size="icon" asChild>
              <Link href="/manga/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Series Grid */}
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
                    : 'No series found in this library'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}

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
                      href={`/manga/library/${libraryId}?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
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
                      href={`/manga/library/${libraryId}?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
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

export default function LibraryPage() {
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
      <LibraryPageContent />
    </Suspense>
  );
}
