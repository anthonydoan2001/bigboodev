'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSeries, useKomgaSettings, useLibraries } from '@/lib/hooks/useManga';
import { SeriesCard } from '@/components/manga/SeriesCard';
import { ContinueReading } from '@/components/manga/ContinueReading';
import { ReadListSection } from '@/components/manga/ReadlistSection';
import { SearchBar } from '@/components/manga/SearchBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Library, ChevronLeft, ChevronRight, Settings, Loader2, BookMarked } from 'lucide-react';
import Link from 'next/link';
import { KomgaLibrary } from '@/types/komga';

// Library section component
function LibrarySection({
  library,
  search,
  page,
  showReadLists = false,
}: {
  library: KomgaLibrary;
  search: string;
  page: number;
  showReadLists?: boolean;
}) {
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
    size: 12,
    search: search || undefined,
    libraryId: library.id,
    enabled: true,
  });

  // Determine icon based on library name
  const isComic = library.name.toLowerCase().includes('comic');
  const Icon = isComic ? BookMarked : BookOpen;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{library.name}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{library.name}</h2>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Failed to load series'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{library.name}</h2>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {search
                ? `No series found for "${search}"`
                : 'No series found in this library'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reading Lists (only for comic libraries) */}
      {showReadLists && !search && <ReadListSection enabled={true} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{library.name}</h2>
            <span className="text-sm text-muted-foreground">
              ({totalElements} series)
            </span>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {totalPages > 1 && (
            <Link
              href={`/manga/library/${library.id}`}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>

        {/* Pagination for individual library (only if searching) */}
        {search && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
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
      </div>
    </div>
  );
}

function MangaLibraryContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const { configured, isLoading: settingsLoading } = useKomgaSettings();
  const { libraries, isLoading: librariesLoading } = useLibraries({ enabled: configured });

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
                  Configure your Komga server to start reading manga
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

  // Sort libraries to show "Manga" first, then "Comic", then others alphabetically
  const sortedLibraries = [...libraries].sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    if (aLower.includes('manga') && !bLower.includes('manga')) return -1;
    if (!aLower.includes('manga') && bLower.includes('manga')) return 1;
    if (aLower.includes('comic') && !bLower.includes('comic')) return -1;
    if (!aLower.includes('comic') && bLower.includes('comic')) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Library</h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-80">
              <SearchBar placeholder="Search all series..." />
            </div>
            <Button variant="outline" size="icon" asChild>
              <Link href="/manga/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Continue Reading - shows both manga and comics */}
        {!search && <ContinueReading limit={6} />}

        {/* Library Sections */}
        {librariesLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="aspect-[2/3] rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : libraries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Library className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No libraries found on your Komga server
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {sortedLibraries.map((library) => {
              const isComic = library.name.toLowerCase().includes('comic');
              return (
                <LibrarySection
                  key={library.id}
                  library={library}
                  search={search}
                  page={search ? page : 0}
                  showReadLists={isComic}
                />
              );
            })}
          </div>
        )}
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
